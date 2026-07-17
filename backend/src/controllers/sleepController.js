const Sleep = require('../models/Sleep');
const { resolveDayStart, startOfDayDaysAgo } = require('../utils/time');

exports.logSleep = async (req, res, next) => {
  try {
    const { bedtime, wakeTime, duration, quality, notes, date } = req.body;
    const targetDate = resolveDayStart(date, req.user.timezone);

    const sleep = await Sleep.findOneAndUpdate(
      { user: req.user._id, date: targetDate },
      { bedtime, wakeTime, duration, quality, notes },
      { upsert: true, new: true, runValidators: true }
    );
    res.status(201).json(sleep);
  } catch (err) { next(err); }
};

exports.deleteSleep = async (req, res, next) => {
  try {
    const entry = await Sleep.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    res.json({ message: 'Entry deleted' });
  } catch (err) { next(err); }
};

exports.getSleepHistory = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const entries = await Sleep.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(limit);
    res.json(entries);
  } catch (err) { next(err); }
};

exports.getSleepStats = async (req, res, next) => {
  try {
    const thirtyDaysAgo = startOfDayDaysAgo(new Date(), req.user.timezone, 30);

    const entries = await Sleep.find({
      user: req.user._id,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: 1 });

    const avgDuration = entries.length
      ? Math.round((entries.reduce((s, e) => s + (e.duration || 0), 0) / entries.length) * 10) / 10
      : 0;
    const avgQuality = entries.length
      ? Math.round((entries.reduce((s, e) => s + (e.quality || 0), 0) / entries.length) * 10) / 10
      : 0;

    res.json({
      entries: entries.map(e => ({ date: e.date.toISOString().slice(0, 10), duration: e.duration, quality: e.quality })),
      avgDuration,
      avgQuality,
      totalEntries: entries.length
    });
  } catch (err) { next(err); }
};
