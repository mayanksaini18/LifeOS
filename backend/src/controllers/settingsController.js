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

const MAX_PUSH_SUBSCRIPTIONS = 20;

exports.subscribePush = async (req, res, next) => {
  try {
    const body = req.body || {};
    // Validate shape and store only the known web-push fields — never the raw
    // request body — so an attacker can't stuff arbitrary/oversized data into
    // the user document (which is capped at 16MB).
    if (typeof body.endpoint !== 'string' || !/^https:\/\//.test(body.endpoint) || body.endpoint.length > 2048) {
      return res.status(400).json({ message: 'Invalid push subscription' });
    }
    const keys = body.keys && typeof body.keys === 'object' ? body.keys : {};
    const subscription = {
      endpoint: body.endpoint,
      expirationTime: typeof body.expirationTime === 'number' ? body.expirationTime : null,
      keys: {
        p256dh: typeof keys.p256dh === 'string' ? keys.p256dh.slice(0, 256) : undefined,
        auth: typeof keys.auth === 'string' ? keys.auth.slice(0, 256) : undefined,
      },
    };

    // Remove any existing entry for this endpoint, then re-add — and cap the
    // array so a client churning endpoints can't grow it without bound.
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { pushSubscriptions: { endpoint: subscription.endpoint } }
    });
    await User.findByIdAndUpdate(req.user._id, {
      $push: { pushSubscriptions: { $each: [subscription], $slice: -MAX_PUSH_SUBSCRIPTIONS } }
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
