const Mood = require('../models/Mood');
const { startOfDay, startOfDayDaysAgo } = require('../utils/time');

exports.logMood = async (req, res, next) => {
  try {
    const { score, energy, notes, tags } = req.body;
    const today = startOfDay(new Date(), req.user.timezone);

    const mood = await Mood.findOneAndUpdate(
      { user: req.user._id, date: today },
      { score, energy, notes, tags },
      { upsert: true, new: true, runValidators: true }
    );
    res.status(201).json(mood);
  } catch (err) { next(err); }
};

exports.getMoods = async (req, res, next) => {
  try {
    const { from, to, limit = 30 } = req.query;
    const query = { user: req.user._id };

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    const moods = await Mood.find(query)
      .sort({ date: -1 })
      .limit(Math.min(Number(limit), 100));

    res.json(moods);
  } catch (err) { next(err); }
};

exports.getMoodTrends = async (req, res, next) => {
  try {
    const thirtyDaysAgo = startOfDayDaysAgo(new Date(), req.user.timezone, 30);

    const moods = await Mood.find({
      user: req.user._id,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: 1 });

    const trends = moods.map(m => ({
      date: m.date.toISOString().slice(0, 10),
      score: m.score,
      energy: m.energy ?? null,
      tags: m.tags
    }));

    const avgScore = moods.length
      ? Math.round((moods.reduce((sum, m) => sum + m.score, 0) / moods.length) * 10) / 10
      : 0;

    const energyEntries = moods.filter(m => m.energy != null);
    const avgEnergy = energyEntries.length
      ? Math.round((energyEntries.reduce((sum, m) => sum + m.energy, 0) / energyEntries.length) * 10) / 10
      : 0;

    res.json({ trends, avgScore, avgEnergy, totalEntries: moods.length });
  } catch (err) { next(err); }
};

exports.updateMood = async (req, res, next) => {
  try {
    // Whitelist updatable fields. Forwarding raw req.body would let a caller
    // reassign the entry's `user`/`date` (mass-assignment), moving it to
    // another account or a different day.
    const { score, energy, notes, tags } = req.body;
    const mood = await Mood.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { score, energy, notes, tags },
      { new: true, runValidators: true }
    );
    if (!mood) return res.status(404).json({ message: 'Mood entry not found' });
    res.json(mood);
  } catch (err) { next(err); }
};

exports.deleteMood = async (req, res, next) => {
  try {
    const mood = await Mood.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!mood) return res.status(404).json({ message: 'Mood entry not found' });
    res.json({ message: 'Mood entry deleted' });
  } catch (err) { next(err); }
};
