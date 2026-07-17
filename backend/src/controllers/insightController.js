const Insight = require('../models/Insight');
const Habit = require('../models/Habit');
const Mood = require('../models/Mood');
const Sleep = require('../models/Sleep');
const Water = require('../models/Water');
const Fitness = require('../models/Fitness');
const { startOfDayDaysAgo } = require('../utils/time');
const { isEnabled, getClient, getModel } = require('../services/ai');

async function gatherWeeklyData(userId, timeZone) {
  const weekAgo = startOfDayDaysAgo(new Date(), timeZone, 7);

  const [habits, moods, sleeps, waters, fitness] = await Promise.all([
    Habit.find({ user: userId, isActive: true }),
    Mood.find({ user: userId, date: { $gte: weekAgo } }).sort({ date: 1 }),
    Sleep.find({ user: userId, date: { $gte: weekAgo } }).sort({ date: 1 }),
    Water.find({ user: userId, date: { $gte: weekAgo } }).sort({ date: 1 }),
    Fitness.find({ user: userId, date: { $gte: weekAgo } }).sort({ date: 1 }),
  ]);

  const habitCompletions = habits.map(h => {
    const weekCheckins = h.checkins.filter(c => new Date(c.date) >= weekAgo).length;
    return { title: h.title, category: h.category, checkins: weekCheckins, streak: h.streak };
  });

  return {
    habits: habitCompletions,
    moods: moods.map(m => ({ date: m.date.toISOString().slice(0, 10), score: m.score, tags: m.tags })),
    sleep: sleeps.map(s => ({ date: s.date.toISOString().slice(0, 10), duration: s.duration, quality: s.quality })),
    water: waters.map(w => ({ date: w.date.toISOString().slice(0, 10), glasses: w.glasses, goal: w.goal })),
    fitness: fitness.map(f => ({ date: f.date.toISOString().slice(0, 10), duration: f.totalDuration, calories: f.totalCalories })),
  };
}

exports.getWeeklyReport = async (req, res, next) => {
  try {
    const weekStart = startOfDayDaysAgo(new Date(), req.user.timezone, 7);

    // Check cache first
    const cached = await Insight.findOne({
      user: req.user._id,
      type: 'weekly_report',
      weekOf: { $gte: weekStart }
    });

    if (cached) return res.json(cached);

    const weeklyData = await gatherWeeklyData(req.user._id, req.user.timezone);

    // Generate the AI report via the shared client (single source of model +
    // timeout config). Log real failures instead of silently falling back.
    let content;
    if (isEnabled()) {
      try {
        const message = await getClient().messages.create({
          model: getModel(),
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: `You are a wellness coach. Analyze this user's weekly data and provide a brief, encouraging wellness report with 3-4 key insights and 2 actionable suggestions. Be specific about correlations you notice. Keep it under 300 words.

Weekly Data:
${JSON.stringify(weeklyData, null, 2)}`
          }]
        });
        content = message.content?.[0]?.type === 'text' ? message.content[0].text : '';
      } catch (err) {
        console.error('[insights weekly] AI generation failed:', err.message);
      }
    }

    if (!content) {
      // Fallback: AI disabled, errored, or returned nothing — compute a summary.
      const { habits, moods, sleep, water, fitness } = weeklyData;
      const avgMood = moods.length ? (moods.reduce((s, m) => s + m.score, 0) / moods.length).toFixed(1) : 'N/A';
      const avgSleep = sleep.length ? (sleep.reduce((s, e) => s + (e.duration || 0), 0) / sleep.length).toFixed(1) : 'N/A';
      const totalCheckins = habits.reduce((s, h) => s + h.checkins, 0);
      const waterAvg = water.length ? Math.round(water.reduce((s, w) => s + w.glasses, 0) / water.length) : 0;
      const fitnessDays = fitness.length;

      content = `## Weekly Wellness Summary\n\n` +
        `**Habits:** ${totalCheckins} check-ins across ${habits.length} habits this week.\n` +
        `**Mood:** Average score ${avgMood}/5 over ${moods.length} entries.\n` +
        `**Sleep:** Averaging ${avgSleep} hours per night.\n` +
        `**Water:** Averaging ${waterAvg} glasses per day.\n` +
        `**Fitness:** Active on ${fitnessDays} days this week.\n\n` +
        `Keep up the consistency! Focus on maintaining your streaks and staying hydrated.`;
    }

    const insight = await Insight.create({
      user: req.user._id,
      type: 'weekly_report',
      content,
      data: weeklyData,
      weekOf: weekStart,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    res.json(insight);
  } catch (err) { next(err); }
};

// Pearson correlation coefficient for two equal-length arrays
function pearson(xs, ys) {
  const n = xs.length;
  if (n < 3) return 0;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((s, x, i) => s + (x - meanX) * (ys[i] - meanY), 0);
  const den = Math.sqrt(
    xs.reduce((s, x) => s + (x - meanX) ** 2, 0) *
    ys.reduce((s, y) => s + (y - meanY) ** 2, 0)
  );
  return den === 0 ? 0 : Math.round((num / den) * 100) / 100;
}

function strength(r) {
  const abs = Math.abs(r);
  if (abs >= 0.6) return 'strong';
  if (abs >= 0.35) return 'moderate';
  return 'weak';
}

function direction(r) {
  return r >= 0 ? 'positive' : 'negative';
}

exports.getCorrelations = async (req, res, next) => {
  try {
    const thirtyDaysAgo = startOfDayDaysAgo(new Date(), req.user.timezone, 30);

    const [moods, sleeps, waters, habits, fitness] = await Promise.all([
      Mood.find({ user: req.user._id, date: { $gte: thirtyDaysAgo } }).sort({ date: 1 }),
      Sleep.find({ user: req.user._id, date: { $gte: thirtyDaysAgo } }).sort({ date: 1 }),
      Water.find({ user: req.user._id, date: { $gte: thirtyDaysAgo } }).sort({ date: 1 }),
      Habit.find({ user: req.user._id, isActive: true }),
      Fitness.find({ user: req.user._id, date: { $gte: thirtyDaysAgo } }).sort({ date: 1 }),
    ]);

    const correlations = [];

    // Build date-keyed maps
    const moodByDate = Object.fromEntries(moods.map(m => [m.date.toISOString().slice(0, 10), m.score]));
    const energyByDate = Object.fromEntries(moods.filter(m => m.energy != null).map(m => [m.date.toISOString().slice(0, 10), m.energy]));
    const sleepByDate = Object.fromEntries(sleeps.map(s => [s.date.toISOString().slice(0, 10), s.duration]));
    const waterByDate = Object.fromEntries(waters.map(w => [w.date.toISOString().slice(0, 10), w.glasses]));
    const fitnessDates = new Set(fitness.map(f => f.date.toISOString().slice(0, 10)));

    // 1. Sleep duration → next-day mood
    const sleepMoodPairs = sleeps
      .map(s => {
        const sleepDate = new Date(s.date);
        const nextDay = new Date(sleepDate);
        nextDay.setUTCDate(sleepDate.getUTCDate() + 1);
        const nextKey = nextDay.toISOString().slice(0, 10);
        const mood = moodByDate[nextKey];
        return mood != null ? { sleep: s.duration, mood } : null;
      })
      .filter(Boolean);

    if (sleepMoodPairs.length >= 4) {
      const r = pearson(sleepMoodPairs.map(p => p.sleep), sleepMoodPairs.map(p => p.mood));
      const str = strength(r);
      if (str !== 'weak') {
        correlations.push({
          id: 'sleep-mood',
          title: r > 0 ? 'More sleep → better mood' : 'Sleep duration vs mood mismatch',
          description: r > 0
            ? `On days after you sleep longer, your mood tends to be higher. Based on ${sleepMoodPairs.length} data points.`
            : `Interestingly, longer sleep nights don't seem to improve your next-day mood. Consider sleep quality, not just duration.`,
          strength: str,
          direction: direction(r),
          r,
        });
      }
    }

    // 2. Water intake → same-day mood
    const waterMoodDates = Object.keys(waterByDate).filter(d => moodByDate[d] != null);
    if (waterMoodDates.length >= 4) {
      const r = pearson(
        waterMoodDates.map(d => waterByDate[d]),
        waterMoodDates.map(d => moodByDate[d])
      );
      const str = strength(r);
      if (str !== 'weak') {
        correlations.push({
          id: 'water-mood',
          title: r > 0 ? 'Hydration lifts your mood' : 'Water intake and mood are inversely linked',
          description: r > 0
            ? `Days when you drink more water correlate with higher mood scores. Staying hydrated is paying off.`
            : `You tend to track lower mood on high-water days — could be that you drink more when you feel off. Consider tracking why.`,
          strength: str,
          direction: direction(r),
          r,
        });
      }
    }

    // 3. Exercise days → sleep duration
    const exerciseSleepPairs = sleeps
      .map(s => {
        const dateKey = s.date.toISOString().slice(0, 10);
        return { exercised: fitnessDates.has(dateKey) ? 1 : 0, sleep: s.duration };
      });

    if (exerciseSleepPairs.length >= 4) {
      const r = pearson(
        exerciseSleepPairs.map(p => p.exercised),
        exerciseSleepPairs.map(p => p.sleep)
      );
      const str = strength(r);
      if (str !== 'weak') {
        correlations.push({
          id: 'exercise-sleep',
          title: r > 0 ? 'Exercise improves your sleep' : 'Exercise days linked to shorter sleep',
          description: r > 0
            ? `On days you work out, you tend to sleep longer. Your body is rewarding the effort.`
            : `You seem to sleep less on exercise days — possibly due to late workouts or higher energy. Try exercising earlier in the day.`,
          strength: str,
          direction: direction(r),
          r,
        });
      }
    }

    // 4. Habit completions per day → mood
    const habitCheckinByDate = {};
    habits.forEach(h => {
      h.checkins
        .filter(c => new Date(c.date) >= thirtyDaysAgo)
        .forEach(c => {
          const key = new Date(c.date).toISOString().slice(0, 10);
          habitCheckinByDate[key] = (habitCheckinByDate[key] || 0) + 1;
        });
    });
    const habitMoodDates = Object.keys(habitCheckinByDate).filter(d => moodByDate[d] != null);
    if (habitMoodDates.length >= 4) {
      const r = pearson(
        habitMoodDates.map(d => habitCheckinByDate[d]),
        habitMoodDates.map(d => moodByDate[d])
      );
      const str = strength(r);
      if (str !== 'weak') {
        correlations.push({
          id: 'habits-mood',
          title: r > 0 ? 'Completing habits boosts mood' : 'High habit days and mood don\'t align',
          description: r > 0
            ? `Days with more habit completions tend to have higher mood scores. Consistency is building your sense of progress.`
            : `You rate your mood lower on high-habit days. This might mean you're pushing too hard — consider whether your goals are sustainable.`,
          strength: str,
          direction: direction(r),
          r,
        });
      }
    }

    // 5. Sleep consistency (low std dev) vs avg mood
    if (sleeps.length >= 5) {
      const sleepDurations = sleeps.map(s => s.duration);
      const mean = sleepDurations.reduce((a, b) => a + b, 0) / sleepDurations.length;
      const stdDev = Math.sqrt(sleepDurations.reduce((s, d) => s + (d - mean) ** 2, 0) / sleepDurations.length);
      const avgMood = moods.length ? moods.reduce((s, m) => s + m.score, 0) / moods.length : null;

      if (avgMood != null) {
        const isConsistent = stdDev < 1;
        const moodGood = avgMood >= 3.5;
        if (isConsistent && moodGood) {
          correlations.push({
            id: 'sleep-consistency',
            title: 'Consistent sleep schedule supports good mood',
            description: `Your sleep varies by only ${stdDev.toFixed(1)}h and your average mood is ${avgMood.toFixed(1)}/5. A regular sleep schedule is one of your strongest wellness habits.`,
            strength: 'strong',
            direction: 'positive',
            r: null,
          });
        } else if (!isConsistent && !moodGood) {
          correlations.push({
            id: 'sleep-consistency',
            title: 'Irregular sleep may be affecting your mood',
            description: `Your sleep varies by ${stdDev.toFixed(1)}h night to night. Inconsistent sleep is often linked to lower mood. Try going to bed at the same time each night.`,
            strength: 'moderate',
            direction: 'negative',
            r: null,
          });
        }
      }
    }

    // 6. Sleep duration → next-day energy
    const sleepEnergyPairs = sleeps
      .map(s => {
        const sleepDate = new Date(s.date);
        const nextDay = new Date(sleepDate);
        nextDay.setUTCDate(sleepDate.getUTCDate() + 1);
        const nextKey = nextDay.toISOString().slice(0, 10);
        const energy = energyByDate[nextKey];
        return energy != null ? { sleep: s.duration, energy } : null;
      })
      .filter(Boolean);

    if (sleepEnergyPairs.length >= 4) {
      const r = pearson(sleepEnergyPairs.map(p => p.sleep), sleepEnergyPairs.map(p => p.energy));
      const str = strength(r);
      if (str !== 'weak') {
        correlations.push({
          id: 'sleep-energy',
          title: r > 0 ? 'More sleep → higher energy' : 'Sleep isn\'t boosting your energy',
          description: r > 0
            ? `After longer sleep, your energy levels tend to be higher. Based on ${sleepEnergyPairs.length} data points.`
            : `Longer sleep doesn't seem to boost your energy. You might be oversleeping or your sleep quality may need attention.`,
          strength: str,
          direction: direction(r),
          r,
        });
      }
    }

    // 7. Exercise → same-day energy
    const energyDates = Object.keys(energyByDate);
    const exerciseEnergyPairs = energyDates
      .map(d => ({ exercised: fitnessDates.has(d) ? 1 : 0, energy: energyByDate[d] }));

    if (exerciseEnergyPairs.length >= 4) {
      const r = pearson(
        exerciseEnergyPairs.map(p => p.exercised),
        exerciseEnergyPairs.map(p => p.energy)
      );
      const str = strength(r);
      if (str !== 'weak') {
        correlations.push({
          id: 'exercise-energy',
          title: r > 0 ? 'Exercise fuels your energy' : 'Exercise days feel draining',
          description: r > 0
            ? `On workout days, your energy levels are noticeably higher. Movement is working for you.`
            : `You report lower energy on exercise days. Try lighter workouts or exercising at a different time.`,
          strength: str,
          direction: direction(r),
          r,
        });
      }
    }

    // 8. Water → same-day energy
    const waterEnergyDates = Object.keys(waterByDate).filter(d => energyByDate[d] != null);
    if (waterEnergyDates.length >= 4) {
      const r = pearson(
        waterEnergyDates.map(d => waterByDate[d]),
        waterEnergyDates.map(d => energyByDate[d])
      );
      const str = strength(r);
      if (str !== 'weak') {
        correlations.push({
          id: 'water-energy',
          title: r > 0 ? 'Hydration powers your energy' : 'Water intake and energy don\'t align',
          description: r > 0
            ? `Days with higher water intake correlate with more energy. Keep drinking!`
            : `More water doesn't seem to boost your energy — consider whether other factors like sleep or stress are dominating.`,
          strength: str,
          direction: direction(r),
          r,
        });
      }
    }

    const energyCount = moods.filter(m => m.energy != null).length;
    res.json({ correlations, dataPoints: { mood: moods.length, energy: energyCount, sleep: sleeps.length, water: waters.length, fitness: fitness.length } });
  } catch (err) { next(err); }
};

exports.getInsights = async (req, res, next) => {
  try {
    const insights = await Insight.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(insights);
  } catch (err) { next(err); }
};
