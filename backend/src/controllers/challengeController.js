const Challenge = require('../models/Challenge');
const Mood = require('../models/Mood');
const Sleep = require('../models/Sleep');
const Water = require('../models/Water');
const Fitness = require('../models/Fitness');
const Habit = require('../models/Habit');
const Journal = require('../models/Journal');
const User = require('../models/User');
const XP_PER_LEVEL = 100;

function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1; // Monday start
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

const CATALOG = [
  { key: 'sleep-7',     title: 'Rest Week',         description: 'Log 7 hours of sleep on 5 days this week', module: 'sleep',    target: 5, xpReward: 60 },
  { key: 'water-goal',  title: 'Hydration Streak',  description: 'Hit your water goal on 5 days this week',  module: 'water',    target: 5, xpReward: 50 },
  { key: 'exercise-3',  title: 'Move Three',        description: 'Exercise on 3 separate days this week',    module: 'exercise', target: 3, xpReward: 70 },
  { key: 'mood-log',    title: 'Check-In',          description: 'Log your mood on 6 days this week',        module: 'mood',     target: 6, xpReward: 40 },
  { key: 'journal-3',   title: 'Reflect',           description: 'Write a journal entry on 3 days this week', module: 'journal', target: 3, xpReward: 50 },
  { key: 'habits-20',   title: 'Consistency',       description: 'Complete 20 habit check-ins this week',    module: 'habits',   target: 20, xpReward: 80 },
];

function pickWeekly(weekStart) {
  const seed = weekStart.getUTCDate() + weekStart.getUTCMonth() * 31;
  const shuffled = [...CATALOG].sort((a, b) => {
    return ((a.key.charCodeAt(0) + seed) % 7) - ((b.key.charCodeAt(0) + seed) % 7);
  });
  return shuffled.slice(0, 3);
}

async function computeProgress(userId, challenge, weekStart, weekEnd) {
  const range = { $gte: weekStart, $lt: weekEnd };
  switch (challenge.module) {
    case 'sleep': {
      const rows = await Sleep.find({ user: userId, date: range, duration: { $gte: 7 } }).lean();
      return rows.length;
    }
    case 'water': {
      const rows = await Water.find({ user: userId, date: range }).lean();
      return rows.filter((r) => (r.glasses || 0) >= (r.goal || 8)).length;
    }
    case 'exercise': {
      const rows = await Fitness.find({ user: userId, date: range }).lean();
      return rows.filter((r) => (r.exercises?.length || 0) > 0).length;
    }
    case 'mood': {
      return Mood.countDocuments({ user: userId, date: range });
    }
    case 'journal': {
      return Journal.countDocuments({ user: userId, date: range });
    }
    case 'habits': {
      const habits = await Habit.find({ user: userId, isActive: true }).lean();
      let total = 0;
      for (const h of habits) {
        total += (h.checkins || []).filter((c) => c.date >= weekStart && c.date < weekEnd).length;
      }
      return total;
    }
    default:
      return 0;
  }
}

exports.getChallenges = async (req, res, next) => {
  try {
    const weekStart = getWeekStart();
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

    let challenges = await Challenge.find({ user: req.user._id, weekStart }).lean();

    if (challenges.length === 0) {
      const picks = pickWeekly(weekStart);
      const docs = await Promise.all(picks.map((p) =>
        Challenge.findOneAndUpdate(
          { user: req.user._id, weekStart, key: p.key },
          { $setOnInsert: { ...p, user: req.user._id, weekStart } },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        )
      ));
      challenges = docs.map((d) => d.toObject());
    }

    // Update progress
    for (const c of challenges) {
      if (c.completed) continue;
      const progress = await computeProgress(req.user._id, c, weekStart, weekEnd);
      if (progress >= c.target) {
        // Claim completion atomically. Only the request that actually flips
        // completed:false -> true awards XP, so two concurrent GETs (two tabs,
        // refetch-on-focus, a retry) can't double-credit the reward.
        const claim = await Challenge.updateOne(
          { _id: c._id, completed: false },
          { $set: { progress, completed: true, completedAt: new Date() } }
        );
        if (claim.modifiedCount === 1) {
          await User.findByIdAndUpdate(req.user._id, { $inc: { xp: c.xpReward } });
        }
        Object.assign(c, { progress, completed: true, completedAt: new Date() });
      } else if (progress !== c.progress) {
        await Challenge.updateOne({ _id: c._id }, { $set: { progress } });
        Object.assign(c, { progress });
      }
    }

    // Refresh user XP/level after possible increments
    if (challenges.some((c) => c.completed)) {
      const fresh = await User.findById(req.user._id).lean();
      const level = Math.floor(fresh.xp / XP_PER_LEVEL) + 1;
      if (level !== fresh.level) {
        await User.updateOne({ _id: req.user._id }, { $set: { level } });
      }
    }

    res.json({ challenges, weekStart });
  } catch (err) { next(err); }
};
