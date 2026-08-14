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
// Use the -core variant: identical API, but NO install-time binary download
// (no postinstall), so `npm install` on the deploy host stays fast and can't
// fail on a blocked MongoDB CDN. The binary is fetched lazily only when a test
// actually starts the server below.
const { MongoMemoryServer } = require('mongodb-memory-server-core');

const app = require('../src/app');
const User = require('../src/models/User');
const Mood = require('../src/models/Mood');
const Habit = require('../src/models/Habit');
const Water = require('../src/models/Water');
const Fitness = require('../src/models/Fitness');
const { startOfDay } = require('../src/utils/time');
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

// ---- timezone endpoint validates + stores the zone ----
test('PUT /settings/timezone validates and stores the IANA zone', async () => {
  const { user, auth } = await makeUser();
  const bad = await request(app).put('/api/settings/timezone').set('Authorization', auth).send({ timezone: 'Not/AZone' });
  assert.equal(bad.status, 400);
  const ok = await request(app).put('/api/settings/timezone').set('Authorization', auth).send({ timezone: 'Asia/Kolkata' });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.timezone, 'Asia/Kolkata');
  assert.equal((await User.findById(user._id)).timezone, 'Asia/Kolkata');
});

// ---- logging is bucketed by the user's local day, not UTC ----
test('water is bucketed by the user timezone (IST local midnight)', async () => {
  const { auth } = await makeUser({ timezone: 'Asia/Kolkata' });
  const res = await request(app).post('/api/water').set('Authorization', auth).send({ glasses: 1 });
  assert.equal(res.status, 201);
  const expected = startOfDay(new Date(), 'Asia/Kolkata');
  assert.equal(new Date(res.body.date).getTime(), expected.getTime(), 'stored date must be the IST local midnight');
});

// ---- exercise logging merges into the day, not overwrites ----
test('logging a second workout the same day appends (does not wipe the first)', async () => {
  const { auth } = await makeUser();
  await request(app).post('/api/fitness').set('Authorization', auth).send({ exercises: [{ name: 'Run', duration: 30 }] });
  const res = await request(app).post('/api/fitness').set('Authorization', auth).send({ exercises: [{ name: 'Yoga', duration: 20 }] });
  assert.equal(res.status, 201);
  assert.equal(res.body.exercises.length, 2, 'both workouts should be present');
  assert.equal(res.body.totalDuration, 50, 'durations should accumulate');
});

// ---- delete route removes a user's own entry and is ownership-scoped ----
test('DELETE /water/:id removes the entry (and only the owner\'s)', async () => {
  const { user, auth } = await makeUser();
  const other = await makeUser();
  const w = await Water.create({ user: user._id, date: startOfDay(new Date(), 'UTC'), glasses: 3 });

  // another user can't delete it
  const forbidden = await request(app).delete(`/api/water/${w._id}`).set('Authorization', other.auth);
  assert.equal(forbidden.status, 404);
  assert.ok(await Water.findById(w._id), 'entry still exists');

  const ok = await request(app).delete(`/api/water/${w._id}`).set('Authorization', auth);
  assert.equal(ok.status, 200);
  assert.equal(await Water.findById(w._id), null, 'entry deleted');
});

// ---- CSRF: mutating requests from a disallowed Origin are blocked ----
test('a mutating request from a disallowed Origin is rejected (CSRF)', async () => {
  const { auth } = await makeUser();
  const evil = await request(app).post('/api/water').set('Authorization', auth).set('Origin', 'https://evil.example').send({ glasses: 1 });
  assert.equal(evil.status, 403);
  // No Origin (native/server) is allowed through to the handler.
  const noOrigin = await request(app).post('/api/water').set('Authorization', auth).send({ glasses: 1 });
  assert.equal(noOrigin.status, 201);
});

// ---- email verification: JSON for the frontend page, redirect for direct hits ----
const sha256 = (s) => require('node:crypto').createHash('sha256').update(s).digest('hex');

test('GET /auth/verify-email returns JSON and verifies when Accept: application/json', async () => {
  const raw = 'verify-token-xyz';
  const user = await User.create({
    email: 'verify@x.com', password: 'x', emailVerified: false,
    emailVerificationTokenHash: sha256(raw),
    emailVerificationExpiresAt: new Date(Date.now() + 3600e3),
  });
  const res = await request(app).get(`/api/auth/verify-email?token=${raw}`).set('Accept', 'application/json');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.equal((await User.findById(user._id)).emailVerified, true);
});

test('GET /auth/verify-email 400s JSON on a bad token (Accept json)', async () => {
  const res = await request(app).get('/api/auth/verify-email?token=nope').set('Accept', 'application/json');
  assert.equal(res.status, 400);
});

test('GET /auth/verify-email redirects a direct browser hit (no json Accept)', async () => {
  const res = await request(app).get('/api/auth/verify-email?token=nope').set('Accept', 'text/html').redirects(0);
  assert.equal(res.status, 302);
  assert.match(res.headers.location, /verified=0/);
});

// ---- password reset ----
// RESEND_API_KEY is unset here, so sendPasswordResetEmail short-circuits to
// { skipped } and no mail is attempted; the token still lands on the user.
const bcryptLib = require('bcryptjs');

async function makeResettableUser(overrides = {}) {
  const raw = `reset-token-${Math.round(Math.random() * 1e9)}`;
  const user = await User.create({
    name: 'Reset', email: `r${Math.round(Math.random() * 1e9)}@x.com`,
    password: await bcryptLib.hash('old-password', 10),
    emailVerified: true,
    passwordResetTokenHash: sha256(raw),
    passwordResetExpiresAt: new Date(Date.now() + 3600e3),
    ...overrides,
  });
  return { user, raw };
}

test('POST /auth/reset-password sets the new password and rejects the old one', async () => {
  const { user, raw } = await makeResettableUser();

  const res = await request(app).post('/api/auth/reset-password').send({ token: raw, password: 'new-password' });
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);

  const fresh = await User.findById(user._id);
  assert.ok(await bcryptLib.compare('new-password', fresh.password), 'new password must work');
  assert.equal(await bcryptLib.compare('old-password', fresh.password), false, 'old password must stop working');
});

test('POST /auth/reset-password does not return a session (no cookies, no accessToken)', async () => {
  const { raw } = await makeResettableUser();
  const res = await request(app).post('/api/auth/reset-password').send({ token: raw, password: 'new-password' });
  assert.equal(res.status, 200);
  assert.equal(res.body.accessToken, undefined);
  assert.equal(res.headers['set-cookie'], undefined);
});

test('POST /auth/reset-password consumes the token so it cannot be replayed', async () => {
  const { raw } = await makeResettableUser();
  const first = await request(app).post('/api/auth/reset-password').send({ token: raw, password: 'new-password' });
  assert.equal(first.status, 200);

  const replay = await request(app).post('/api/auth/reset-password').send({ token: raw, password: 'another-password' });
  assert.equal(replay.status, 400);
});

test('POST /auth/reset-password revokes an existing session refresh token', async () => {
  const { user, raw } = await makeResettableUser({ refreshToken: 'attacker-held-refresh-token' });
  await request(app).post('/api/auth/reset-password').send({ token: raw, password: 'new-password' });
  assert.equal((await User.findById(user._id)).refreshToken, undefined);
});

test('POST /auth/reset-password verifies an unverified account', async () => {
  const { user, raw } = await makeResettableUser({
    emailVerified: false,
    emailVerificationTokenHash: sha256('pending'),
  });
  await request(app).post('/api/auth/reset-password').send({ token: raw, password: 'new-password' });

  const fresh = await User.findById(user._id);
  assert.equal(fresh.emailVerified, true);
  assert.equal(fresh.emailVerificationTokenHash, undefined);
});

test('POST /auth/reset-password 400s on an expired token and leaves the password alone', async () => {
  const { user, raw } = await makeResettableUser({
    passwordResetExpiresAt: new Date(Date.now() - 1000),
  });
  const res = await request(app).post('/api/auth/reset-password').send({ token: raw, password: 'new-password' });
  assert.equal(res.status, 400);
  assert.ok(await bcryptLib.compare('old-password', (await User.findById(user._id)).password));
});

test('POST /auth/forgot-password answers identically for known and unknown emails', async () => {
  const { user } = await makeResettableUser();

  const known = await request(app).post('/api/auth/forgot-password').send({ email: user.email });
  const unknown = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody@x.com' });

  assert.equal(known.status, unknown.status);
  assert.deepEqual(known.body, unknown.body, 'response must not reveal whether the account exists');
});

test('POST /auth/forgot-password issues a hashed token, never storing the raw one', async () => {
  const { user } = await makeResettableUser({ passwordResetTokenHash: undefined, passwordResetExpiresAt: undefined });
  await request(app).post('/api/auth/forgot-password').send({ email: user.email });

  const fresh = await User.findById(user._id);
  assert.ok(fresh.passwordResetTokenHash, 'a reset token hash must be stored');
  assert.match(fresh.passwordResetTokenHash, /^[a-f0-9]{64}$/, 'stored value must be a sha256 hex digest');
  assert.ok(fresh.passwordResetExpiresAt > new Date(), 'token must not be born expired');
});

// ---- CSV export neutralizes spreadsheet formula injection ----
test('GET /export/csv prefixes formula-injection cells', async () => {
  const { user, auth } = await makeUser();
  await Mood.create({ user: user._id, date: new Date('2026-02-02T00:00:00Z'), score: 4, notes: '=SUM(A1)' });
  const res = await request(app).get('/api/export/csv').set('Authorization', auth);
  assert.equal(res.status, 200);
  assert.ok(res.text.includes("'=SUM(A1)"), 'a leading = must be prefixed with a single quote');
});
