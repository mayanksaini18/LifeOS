const Water = require('../models/Water');

function getUTCStartOfDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

exports.logWater = async (req, res, next) => {
  try {
    const { glasses, goal } = req.body;
    const today = getUTCStartOfDay(new Date());
    const userGoal = req.user.goals?.water ?? 8;

    // Seed a new day's goal from the user's profile goal (set at onboarding),
    // not a hardcoded 8. An explicit goal in the body still wins. ($set and
    // $setOnInsert must be kept out of the same path — and never mix an update
    // operator with a bare field, which Mongo rejects.)
    const update = { $inc: { glasses: glasses || 1 } };
    if (goal != null) update.$set = { goal };
    else update.$setOnInsert = { goal: userGoal };

    const water = await Water.findOneAndUpdate(
      { user: req.user._id, date: today },
      update,
      { upsert: true, new: true, runValidators: true }
    );
    res.status(201).json(water);
  } catch (err) { next(err); }
};

exports.getWaterToday = async (req, res, next) => {
  try {
    const today = getUTCStartOfDay(new Date());
    const userGoal = req.user.goals?.water ?? 8;
    const water = await Water.findOne({ user: req.user._id, date: today });
    res.json(water || { glasses: 0, goal: userGoal, date: today });
  } catch (err) { next(err); }
};

exports.getWaterHistory = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const entries = await Water.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(limit);
    res.json(entries);
  } catch (err) { next(err); }
};

exports.setWaterGoal = async (req, res, next) => {
  try {
    const { goal } = req.body;
    const today = getUTCStartOfDay(new Date());
    const water = await Water.findOneAndUpdate(
      { user: req.user._id, date: today },
      { goal },
      { upsert: true, new: true, runValidators: true }
    );
    res.json(water);
  } catch (err) { next(err); }
};
