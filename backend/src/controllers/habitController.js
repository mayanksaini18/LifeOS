const Habit = require('../models/Habit');
const User = require('../models/User');
const { startOfDay, startOfDayDaysAgo, localDateKey } = require('../utils/time');

const XP_PER_CHECKIN = 10;
const XP_PER_LEVEL = 100;

exports.createHabit = async (req, res, next) => {
  try {
    const { title, description, frequency } = req.body;
    const habit = await Habit.create({ user: req.user._id, title, description, frequency });
    res.status(201).json(habit);
  } catch (err) { next(err); }
};

exports.getHabits = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [habits, total] = await Promise.all([
      Habit.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Habit.countDocuments({ user: req.user._id })
    ]);

    res.json({ habits, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

exports.updateHabit = async (req, res, next) => {
  try {
    const { title, description, frequency } = req.body;
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { title, description, frequency },
      { new: true, runValidators: true }
    );
    if (!habit) return res.status(404).json({ message: 'Habit not found' });
    res.json(habit);
  } catch (err) { next(err); }
};

exports.deleteHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });
    res.json({ message: 'Habit deleted' });
  } catch (err) { next(err); }
};

function resetFreezeIfDue(habit) {
  const now = new Date();
  const resetAt = new Date(habit.freezeResetAt);
  const daysSinceReset = Math.floor((now - resetAt) / (1000 * 60 * 60 * 24));
  if (daysSinceReset >= 7) {
    habit.freezesAvailable = 1;
    habit.freezeResetAt = now;
  }
}

exports.checkIn = async (req, res, next) => {
  try {
    const now = new Date();
    const tz = req.user.timezone;
    const today = startOfDay(now, tz);

    // Atomically claim today's check-in slot. The filter `lastCheckinDate != today`
    // matches at most once; the winning request gets the pre-update document
    // (new:false) to compute the streak from, and every concurrent duplicate
    // fails the filter — so XP is awarded exactly once per day, not per race.
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, lastCheckinDate: { $ne: today } },
      { $set: { lastCheckinDate: today } },
      { new: false }
    );

    if (!habit) {
      // Either the habit doesn't exist, or it was already checked in today.
      const exists = await Habit.exists({ _id: req.params.id, user: req.user._id });
      return res.status(exists ? 400 : 404).json({
        message: exists ? 'Already checked in today' : 'Habit not found',
      });
    }

    // Legacy-data guard: a habit created before lastCheckinDate existed could
    // have today's check-in already in the array. The claim set lastCheckinDate
    // (harmless), but don't double-add or double-award.
    if (habit.checkins.some(c => localDateKey(new Date(c.date), tz) === localDateKey(now, tz))) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    resetFreezeIfDue(habit);

    const lastCheckin = habit.checkins.length
      ? new Date(habit.checkins[habit.checkins.length - 1].date)
      : null;

    let newStreak = 1;
    let freezeUsed = false;
    if (lastCheckin) {
      const lastDay = startOfDay(lastCheckin, tz);
      const diffDays = Math.round((today - lastDay) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        newStreak = habit.streak + 1;
      } else if (diffDays === 2 && habit.freezesAvailable > 0) {
        newStreak = habit.streak + 1;
        habit.freezesAvailable -= 1;
        freezeUsed = true;
      }
    }

    habit.streak = newStreak;
    habit.bestStreak = Math.max(habit.bestStreak, habit.streak);
    habit.checkins.push({ date: now, xpEarned: XP_PER_CHECKIN });
    habit.lastCheckinDate = today;
    await habit.save();

    // Atomic XP increment (returns the updated doc); recompute level from it.
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { xp: XP_PER_CHECKIN } },
      { new: true }
    );
    const level = Math.floor(user.xp / XP_PER_LEVEL) + 1;
    if (level !== user.level) {
      await User.updateOne({ _id: req.user._id }, { $set: { level } });
    }

    res.json({ habit, user: { xp: user.xp, level }, freezeUsed });
  } catch (err) { next(err); }
};

exports.weeklyAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const tz = req.user.timezone;

    // The 7 local-day buckets ending today (local), oldest first. Generated with
    // calendar stepping so a DST day can't drift the window.
    const dayMap = {};
    const order = [];
    for (let days = 6; days >= 0; days--) {
      const key = localDateKey(startOfDayDaysAgo(now, tz, days), tz);
      dayMap[key] = 0;
      order.push(key);
    }

    const habits = await Habit.find({ user: userId, isActive: true });

    habits.forEach(habit => {
      habit.checkins.forEach(checkin => {
        const key = localDateKey(new Date(checkin.date), tz);
        if (dayMap[key] !== undefined) {
          dayMap[key]++;
        }
      });
    });

    const result = order.map(dateStr => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(Date.UTC(y, m - 1, d));
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
        count: dayMap[dateStr]
      };
    });

    res.json(result);
  } catch (err) { next(err); }
};
