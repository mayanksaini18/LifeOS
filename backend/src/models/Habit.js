const mongoose = require('mongoose');

const checkinSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  xpEarned: { type: Number, default: 0 }
});

const habitSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, maxlength: 100 },
  description: { type: String, maxlength: 500 },
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
  category: { type: String, enum: ['fitness', 'health', 'learning', 'mindfulness', 'productivity', 'other'], default: 'other' },
  createdAt: { type: Date, default: Date.now },
  checkins: [checkinSchema],
  // UTC day-start of the most recent check-in. Used as an atomic guard so two
  // concurrent check-ins on the same day can't both award XP (see checkIn).
  lastCheckinDate: { type: Date },
  streak: { type: Number, default: 0 },
  bestStreak: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  freezesAvailable: { type: Number, default: 1, min: 0, max: 1 },
  freezeResetAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Habit', habitSchema);
