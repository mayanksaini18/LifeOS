const cron = require('node-cron');
const webpush = require('web-push');
const User = require('./models/User');
const Mood = require('./models/Mood');
const Sleep = require('./models/Sleep');
const Water = require('./models/Water');
const Fitness = require('./models/Fitness');
const { sendReminder: sendEmailReminder, isEnabled: isEmailEnabled } = require('./services/email');
const { startOfDay, localHM } = require('./utils/time');

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@smarthabittracker.online',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

async function sendPush(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err) {
    // Subscription expired or invalid — will be cleaned up
    if (err.statusCode === 410 || err.statusCode === 404) return 'expired';
  }
}

async function processReminders() {
  const now = new Date();

  // Include any user who could receive a reminder — push subscribers or email opt-ins
  const users = await User.find({
    $or: [
      { 'pushSubscriptions.0': { $exists: true } },
      { emailReminders: true },
    ],
  }).lean();

  for (const user of users) {
   try {
    // Match the reminder time against the user's LOCAL clock, and check "already
    // logged today" against the user's LOCAL day — so a "20:00" reminder fires
    // at 8pm in their timezone, not at 20:00 UTC.
    const currentHHMM = localHM(now, user.timezone);
    const todayStart = startOfDay(now, user.timezone);
    const rt = user.reminderTimes || {};
    const modules = ['mood', 'sleep', 'water', 'exercise'];
    const expiredEndpoints = [];

    for (const mod of modules) {
      if (!rt[mod] || rt[mod] !== currentHHMM) continue;

      // Check if already logged today
      let alreadyLogged = false;
      if (mod === 'mood')     alreadyLogged = !!(await Mood.findOne({ user: user._id, date: { $gte: todayStart } }));
      if (mod === 'sleep')    alreadyLogged = !!(await Sleep.findOne({ user: user._id, date: { $gte: todayStart } }));
      if (mod === 'water')    alreadyLogged = !!(await Water.findOne({ user: user._id, date: { $gte: todayStart } }));
      if (mod === 'exercise') alreadyLogged = !!(await Fitness.findOne({ user: user._id, date: { $gte: todayStart } }));

      if (alreadyLogged) continue;

      // Push
      if (process.env.VAPID_PUBLIC_KEY && user.pushSubscriptions?.length) {
        const pushPayloads = {
          mood:     { title: 'How are you feeling?',  body: "Log today's mood — it only takes a second.", url: '/mood' },
          sleep:    { title: 'How did you sleep?',    body: "Track last night's rest.",                   url: '/sleep' },
          water:    { title: 'Stay hydrated!',        body: "Don't forget to log your water intake.",     url: '/water' },
          exercise: { title: 'Time to move!',         body: 'Log your workout for today.',                url: '/fitness' },
        };
        for (const sub of user.pushSubscriptions) {
          const result = await sendPush(sub, pushPayloads[mod]);
          if (result === 'expired') expiredEndpoints.push(sub.endpoint);
        }
      }

      // Email
      if (isEmailEnabled() && user.emailReminders && user.email) {
        await sendEmailReminder({ to: user.email, module: mod });
      }
    }

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      await User.findByIdAndUpdate(user._id, {
        $pull: { pushSubscriptions: { endpoint: { $in: expiredEndpoints } } }
      });
    }
   } catch (err) {
    // Isolate per-user failures so one bad user doesn't skip everyone else.
    console.error(`[scheduler] reminder failed for user ${user._id}:`, err.message);
   }
  }
}

function startScheduler() {
  // Run every minute
  cron.schedule('* * * * *', () => {
    processReminders().catch(console.error);
  });
  console.log('Reminder scheduler started.');
}

module.exports = { startScheduler };
