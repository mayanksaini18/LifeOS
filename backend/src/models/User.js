const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, maxlength: 50 },
  email: { type: String, unique: true, sparse: true, lowercase: true },
  // Legacy: phone sign-in has been removed, so nothing sets these any more.
  // They stay so pre-existing phone-only documents keep validating on save.
  phone: { type: String, unique: true, sparse: true },
  password: { type: String, required: function () { return !this.phone; } },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  // IANA timezone (e.g. "Asia/Kolkata"), auto-detected from the browser. Day
  // boundaries, streaks, reminders and stats are computed in this zone. Existing
  // users read as undefined -> treated as UTC until their client next syncs it.
  timezone: { type: String, default: 'UTC' },
  refreshToken: { type: String },
  goals: {
    sleep:    { type: Number, default: 7, min: 1, max: 24 },
    exercise: { type: Number, default: 4, min: 0, max: 7 },
    mood:     { type: Number, default: 3, min: 1, max: 5 },
    water:    { type: Number, default: 8, min: 1, max: 50 },
  },
  reminderTimes: {
    mood:     { type: String, default: '' },
    sleep:    { type: String, default: '' },
    water:    { type: String, default: '' },
    exercise: { type: String, default: '' },
  },
  pushSubscriptions: { type: [Object], default: [] },
  emailReminders: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  onboardingComplete: { type: Boolean, default: false },
  emailVerificationTokenHash: { type: String, index: true },
  emailVerificationExpiresAt: { type: Date },
  // Same shape as the verification pair above, but a much shorter TTL: a reset
  // link can take over the account, a verification link only confirms it.
  passwordResetTokenHash: { type: String, index: true },
  passwordResetExpiresAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
