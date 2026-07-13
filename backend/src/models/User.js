const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, maxlength: 50 },
  email: { type: String, unique: true, sparse: true, lowercase: true },
  phone: { type: String, unique: true, sparse: true },
  // Password is required only for accounts without a phone (email/Google
  // accounts). Phone accounts authenticate via Firebase and have no password.
  password: { type: String, required: function () { return !this.phone; } },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
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
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
