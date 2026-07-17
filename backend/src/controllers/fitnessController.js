const Fitness = require('../models/Fitness');
const { resolveDayStart, startOfDayDaysAgo } = require('../utils/time');

exports.logExercise = async (req, res, next) => {
  try {
    const { exercises, date } = req.body;
    const targetDate = resolveDayStart(date, req.user.timezone);

    const addDuration = exercises.reduce((s, e) => s + (e.duration || 0), 0);
    const addCalories = exercises.reduce((s, e) => s + (e.calories || 0), 0);

    // Append to the day's workouts and accumulate totals, rather than replacing
    // the whole day — logging an evening workout must not wipe the morning run.
    const fitness = await Fitness.findOneAndUpdate(
      { user: req.user._id, date: targetDate },
      {
        $push: { exercises: { $each: exercises } },
        $inc: { totalDuration: addDuration, totalCalories: addCalories },
      },
      { upsert: true, new: true, runValidators: true }
    );
    res.status(201).json(fitness);
  } catch (err) { next(err); }
};

exports.deleteFitness = async (req, res, next) => {
  try {
    const entry = await Fitness.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    res.json({ message: 'Entry deleted' });
  } catch (err) { next(err); }
};

exports.getFitnessHistory = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const entries = await Fitness.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(limit);
    res.json(entries);
  } catch (err) { next(err); }
};

exports.getFitnessStats = async (req, res, next) => {
  try {
    const sevenDaysAgo = startOfDayDaysAgo(new Date(), req.user.timezone, 7);

    const entries = await Fitness.find({
      user: req.user._id,
      date: { $gte: sevenDaysAgo }
    }).sort({ date: 1 });

    const weeklyDuration = entries.reduce((s, e) => s + e.totalDuration, 0);
    const weeklyCalories = entries.reduce((s, e) => s + e.totalCalories, 0);
    const totalExercises = entries.reduce((s, e) => s + e.exercises.length, 0);

    res.json({ weeklyDuration, weeklyCalories, totalExercises, activeDays: entries.length });
  } catch (err) { next(err); }
};
