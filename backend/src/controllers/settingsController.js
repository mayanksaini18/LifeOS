const webpush = require('web-push');
const User = require('../models/User');

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@smarthabittracker.online',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

exports.updateGoals = async (req, res, next) => {
  try {
    const { sleep, exercise, mood, water } = req.body;
    const update = {};
    if (sleep   != null) update['goals.sleep']    = sleep;
    if (exercise != null) update['goals.exercise'] = exercise;
    if (mood    != null) update['goals.mood']     = mood;
    if (water   != null) update['goals.water']    = water;

    const user = await User.findByIdAndUpdate(
      req.user._id, { $set: update }, { new: true, runValidators: true }
    );
    res.json({
      goals: user.goals,
      reminderTimes: user.reminderTimes,
    });
  } catch (err) { next(err); }
};

exports.completeOnboarding = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { onboardingComplete: true } },
      { new: true }
    );
    res.json({ onboardingComplete: user.onboardingComplete });
  } catch (err) { next(err); }
};

exports.updateReminders = async (req, res, next) => {
  try {
    const { mood, sleep, water, exercise } = req.body;
    const update = {};
    if (mood     !== undefined) update['reminderTimes.mood']     = mood;
    if (sleep    !== undefined) update['reminderTimes.sleep']    = sleep;
    if (water    !== undefined) update['reminderTimes.water']    = water;
    if (exercise !== undefined) update['reminderTimes.exercise'] = exercise;

    const user = await User.findByIdAndUpdate(
      req.user._id, { $set: update }, { new: true }
    );
    res.json({ reminderTimes: user.reminderTimes });
  } catch (err) { next(err); }
};

exports.subscribePush = async (req, res, next) => {
  try {
    const subscription = req.body;
    if (!subscription?.endpoint) {
      return res.status(400).json({ message: 'Invalid push subscription' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { pushSubscriptions: { endpoint: subscription.endpoint } }
    });
    await User.findByIdAndUpdate(req.user._id, {
      $push: { pushSubscriptions: subscription }
    });

    res.json({ message: 'Subscribed to push notifications' });
  } catch (err) { next(err); }
};

exports.unsubscribePush = async (req, res, next) => {
  try {
    const { endpoint } = req.body;
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { pushSubscriptions: { endpoint } }
    });
    res.json({ message: 'Unsubscribed from push notifications' });
  } catch (err) { next(err); }
};

exports.getVapidPublicKey = (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
};

exports.updateEmailReminders = async (req, res, next) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ message: 'enabled must be a boolean' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id, { $set: { emailReminders: enabled } }, { new: true }
    );
    res.json({ emailReminders: user.emailReminders });
  } catch (err) { next(err); }
};
