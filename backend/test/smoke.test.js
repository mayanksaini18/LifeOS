// Backend verification suite for the audit-hardening batch.
// Runs against an in-memory MongoDB (no real DB/creds needed).
//   run: npm test   (backend/)
process.env.NODE_ENV = 'test';
process.env.ACCESS_TOKEN_SECRET = 'test-access-secret-value-1234567890';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-value-1234567890';
process.env.FIREBASE_PROJECT_ID = 'lifeos-f9dc4';

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../src/app');
const User = require('../src/models/User');
const Mood = require('../src/models/Mood');
const Habit = require('../src/models/Habit');
const errorHandler = require('../src/middlewares/errorHandler');
const { aiLimiter } = require('../src/middlewares/aiLimiter');

let mongod;

before(async () => {
  // launchTimeout raised: the first cold launch of the mongod binary is slow.
  mongod = await MongoMemoryServer.create({ instance: { launchTimeout: 45000 } });
  await mongoose.connect(mongod.getUri());
}, { timeout: 60000 });

after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}, { timeout: 20000 });

beforeEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

async function makeUser(extra = {}) {
  const user = await User.create({ name: 'Test', email: `u${Math.round(Math.random() * 1e9)}@x.com`, password: 'x', ...extra });
  const token = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
  return { user, token, auth: `Bearer ${token}` };
}

// ---- errorHandler unit ----
test('errorHandler maps Mongoose ValidationError to 400', () => {
  const err = Object.assign(new Error('bad'), { name: 'ValidationError' });
  let code, payload;
  const res = { headersSent: false, status(c) { code = c; return this; }, json(p) { payload = p; } };
  errorHandler(err, { method: 'POST', originalUrl: '/x' }, res, () => {});
  assert.equal(code, 400);
  assert.ok(payload.message);
});

test('errorHandler delegates to next when headers already sent', () => {
  let nexted = false;
  const res = { headersSent: true, status() { throw new Error('must not be called'); } };
  errorHandler(new Error('boom'), { method: 'GET', originalUrl: '/x' }, res, () => { nexted = true; });
  assert.equal(nexted, true);
});

// ---- aiLimiter unit (isolated app) ----
test('aiLimiter returns 429 after the per-window cap', async () => {
  const mini = express();
  mini.get('/ai', aiLimiter, (req, res) => res.json({ ok: true }));
  let got429 = false;
  for (let i = 0; i < 18; i++) {
    const r = await request(mini).get('/ai');
    if (r.status === 429) { got429 = true; break; }
  }
  assert.equal(got429, true, 'expected a 429 once the AI rate-limit cap is exceeded');
});

// ---- mass-assignment: updateMood cannot reassign owner ----
test('PUT /mood/:id ignores attacker-supplied user/date (mass-assignment)', async () => {
  const { user, auth } = await makeUser();
  const other = await makeUser();
  const mood = await Mood.create({ user: user._id, date: new Date('2026-01-01T00:00:00Z'), score: 3 });

  const res = await request(app)
    .put(`/api/mood/${mood._id}`)
    .set('Authorization', auth)
    .send({ score: 5, user: other.user._id.toString(), date: '2000-01-01T00:00:00Z' });

  assert.equal(res.status, 200);
  const after = await Mood.findById(mood._id);
  assert.equal(String(after.user), String(user._id), 'owner must be unchanged');
  assert.equal(after.score, 5, 'whitelisted field still updates');
  assert.equal(after.date.toISOString(), '2026-01-01T00:00:00.000Z', 'date must be unchanged');
});

// ---- logout revokes the stored refresh token ----
test('POST /logout revokes the stored refresh token', async () => {
  const { user } = await makeUser();
  const refresh = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  user.refreshToken = refresh;
  await user.save();

  const res = await request(app).post('/api/auth/logout').set('Cookie', [`jid=${refresh}`]);
  assert.equal(res.status, 200);
  const after = await User.findById(user._id);
  assert.ok(!after.refreshToken, 'refreshToken should be cleared after logout');
});

// ---- water goal falls back to the profile goal, not hardcoded 8 ----
test('GET /water/today uses the user profile water goal', async () => {
  const { auth } = await makeUser({ goals: { sleep: 7, exercise: 4, mood: 3, water: 12 } });
  const res = await request(app).get('/api/water/today').set('Authorization', auth);
  assert.equal(res.status, 200);
  assert.equal(res.body.goal, 12, 'goal should come from user.goals.water');
});

// ---- habit check-in awards XP exactly once per day ----
test('habit check-in awards XP once; a same-day repeat is rejected', async () => {
  const { user, auth } = await makeUser();
  const habit = await Habit.create({ user: user._id, title: 'Read' });

  const first = await request(app).post(`/api/habits/${habit._id}/checkin`).set('Authorization', auth);
  assert.equal(first.status, 200);
  assert.equal(first.body.user.xp, 10, 'first check-in awards 10 XP');

  const second = await request(app).post(`/api/habits/${habit._id}/checkin`).set('Authorization', auth);
  assert.equal(second.status, 400, 'second same-day check-in is rejected');

  const after = await User.findById(user._id);
  assert.equal(after.xp, 10, 'XP must not be awarded twice for the same day');
});

// ---- CSV export neutralizes spreadsheet formula injection ----
test('GET /export/csv prefixes formula-injection cells', async () => {
  const { user, auth } = await makeUser();
  await Mood.create({ user: user._id, date: new Date('2026-02-02T00:00:00Z'), score: 4, notes: '=SUM(A1)' });
  const res = await request(app).get('/api/export/csv').set('Authorization', auth);
  assert.equal(res.status, 200);
  assert.ok(res.text.includes("'=SUM(A1)"), 'a leading = must be prefixed with a single quote');
});
