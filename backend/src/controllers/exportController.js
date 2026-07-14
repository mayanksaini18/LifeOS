const Mood = require('../models/Mood');
const Sleep = require('../models/Sleep');
const Water = require('../models/Water');
const Fitness = require('../models/Fitness');
const Habit = require('../models/Habit');
const Journal = require('../models/Journal');

async function collect(userId) {
  const [moods, sleeps, waters, fitness, habits, journals] = await Promise.all([
    Mood.find({ user: userId }).sort({ date: 1 }).lean(),
    Sleep.find({ user: userId }).sort({ date: 1 }).lean(),
    Water.find({ user: userId }).sort({ date: 1 }).lean(),
    Fitness.find({ user: userId }).sort({ date: 1 }).lean(),
    Habit.find({ user: userId }).lean(),
    Journal.find({ user: userId }).sort({ date: 1 }).lean(),
  ]);
  return { moods, sleeps, waters, fitness, habits, journals };
}

function csvEscape(v) {
  if (v == null) return '';
  let s = String(v);
  // Neutralize spreadsheet formula injection: a cell beginning with = + - @
  // (or a leading tab/CR) is executed as a formula by Excel/Sheets. Prefix a
  // single quote so it's treated as literal text.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCSV(rows, columns) {
  const header = columns.join(',');
  const body = rows.map((r) => columns.map((c) => csvEscape(r[c])).join(',')).join('\n');
  return `${header}\n${body}`;
}

function ymd(d) {
  return new Date(d).toISOString().slice(0, 10);
}

exports.exportJson = async (req, res, next) => {
  try {
    const data = await collect(req.user._id);
    const payload = {
      exportedAt: new Date().toISOString(),
      user: { email: req.user.email, name: req.user.name },
      ...data,
    };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="lifeos-${ymd(new Date())}.json"`);
    res.send(JSON.stringify(payload, null, 2));
  } catch (err) { next(err); }
};

exports.exportCsv = async (req, res, next) => {
  try {
    const { moods, sleeps, waters, fitness, journals } = await collect(req.user._id);

    const sections = [];
    sections.push('# Mood');
    sections.push(toCSV(
      moods.map((m) => ({ date: ymd(m.date), score: m.score, tags: (m.tags || []).join('|'), notes: m.notes || '' })),
      ['date', 'score', 'tags', 'notes'],
    ));
    sections.push('\n# Sleep');
    sections.push(toCSV(
      sleeps.map((s) => ({ date: ymd(s.date), bedtime: s.bedtime || '', wakeTime: s.wakeTime || '', duration: s.duration ?? '', quality: s.quality ?? '' })),
      ['date', 'bedtime', 'wakeTime', 'duration', 'quality'],
    ));
    sections.push('\n# Water');
    sections.push(toCSV(
      waters.map((w) => ({ date: ymd(w.date), glasses: w.glasses, goal: w.goal })),
      ['date', 'glasses', 'goal'],
    ));
    sections.push('\n# Exercise');
    sections.push(toCSV(
      fitness.map((f) => ({
        date: ymd(f.date),
        totalDuration: f.totalDuration || 0,
        totalCalories: f.totalCalories || 0,
        exercises: (f.exercises || []).map((e) => `${e.name}(${e.duration || 0}m)`).join('|'),
      })),
      ['date', 'totalDuration', 'totalCalories', 'exercises'],
    ));
    sections.push('\n# Journal');
    sections.push(toCSV(
      journals.map((j) => ({ date: ymd(j.date), content: j.content })),
      ['date', 'content'],
    ));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="lifeos-${ymd(new Date())}.csv"`);
    res.send(sections.join('\n'));
  } catch (err) { next(err); }
};
