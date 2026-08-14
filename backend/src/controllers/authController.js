const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const User = require('../models/User');
const { createAccessToken, createRefreshToken } = require('../utils/tokens');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email');

const isProd = process.env.NODE_ENV === 'production';
const APP_URL = process.env.APP_URL || 'https://www.smarthabittracker.online';
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
// Deliberately far shorter than VERIFICATION_TTL_MS — this token can take over
// an account, so a stale inbox is a much bigger exposure.
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

async function issueVerificationToken(user) {
  const raw = crypto.randomBytes(32).toString('hex');
  user.emailVerificationTokenHash = hashToken(raw);
  user.emailVerificationExpiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);
  await user.save();
  return raw;
}

async function issueResetToken(user) {
  const raw = crypto.randomBytes(32).toString('hex');
  user.passwordResetTokenHash = hashToken(raw);
  user.passwordResetExpiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
  await user.save();
  return raw;
}

function setCookieAndRespond(res, user, accessToken, refreshToken) {
  res.cookie('jid', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000
  });

  res.json({
    accessToken,
    user: {
      id: user._id, email: user.email, phone: user.phone, name: user.name, xp: user.xp, level: user.level,
      goals: user.goals ?? { sleep: 7, exercise: 4, mood: 3, water: 8 },
      reminderTimes: user.reminderTimes ?? { mood: '', sleep: '', water: '', exercise: '' },
      emailReminders: user.emailReminders ?? false,
      onboardingComplete: user.onboardingComplete ?? false,
      timezone: user.timezone ?? 'UTC',
    }
  });
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email })) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, emailVerified: false });

    const rawToken = await issueVerificationToken(user);
    const verifyUrl = `${APP_URL}/verify?token=${rawToken}`;
    const result = await sendVerificationEmail({ to: email, url: verifyUrl, name });
    console.log(`[auth/register] verification send result for ${email}:`, result);

    if (result?.error || result?.skipped) {
      return res.status(502).json({
        message: 'Could not send verification email. Please try again or contact support.',
      });
    }

    res.status(201).json({
      ok: true,
      requiresVerification: true,
      email,
      message: 'Check your inbox to verify your email.',
    });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.emailVerified) {
      return res.status(403).json({
        message: 'Please verify your email before signing in.',
        requiresVerification: true,
        email: user.email,
      });
    }

    const accessToken = createAccessToken({ id: user._id });
    const refreshToken = createRefreshToken({ id: user._id });
    user.refreshToken = refreshToken;
    await user.save();

    setCookieAndRespond(res, user, accessToken, refreshToken);
  } catch (err) { next(err); }
};

exports.googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: 'Firebase ID token is required' });

    const decoded = await admin.auth().verifyIdToken(idToken);
    const { email, name, uid } = decoded;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: await bcrypt.hash(uid + Date.now(), 10),
        emailVerified: true,
      });
    } else if (!user.emailVerified) {
      user.emailVerified = true;
      user.emailVerificationTokenHash = undefined;
      user.emailVerificationExpiresAt = undefined;
    }

    const accessToken = createAccessToken({ id: user._id });
    const refreshToken = createRefreshToken({ id: user._id });
    user.refreshToken = refreshToken;
    await user.save();

    setCookieAndRespond(res, user, accessToken, refreshToken);
  } catch (err) {
    if (err.code === 'auth/id-token-expired' || err.code === 'auth/argument-error') {
      return res.status(401).json({ message: 'Invalid or expired Google token' });
    }
    next(err);
  }
};

exports.verifyEmail = async (req, res, next) => {
  // The email link now points at the frontend /verify page, which fetches this
  // endpoint with `Accept: application/json` and shows a branded result. Old
  // links (and any direct browser hit) still get a redirect to the login page.
  const wantsJson = (req.get('accept') || '').includes('application/json');
  const fail = (reason, message) =>
    wantsJson
      ? res.status(400).json({ message })
      : res.redirect(`${APP_URL}/login?verified=0&reason=${reason}`);
  try {
    const token = (req.query.token || '').toString();
    if (!token) return fail('missing', 'Missing verification token.');

    const user = await User.findOne({
      emailVerificationTokenHash: hashToken(token),
      emailVerificationExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return fail('expired', 'This verification link is invalid or has expired.');
    }

    user.emailVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save();

    if (wantsJson) {
      return res.json({ ok: true, message: 'Email verified. You can now sign in.' });
    }
    res.redirect(`${APP_URL}/login?verified=1`);
  } catch (err) { next(err); }
};

exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = email ? await User.findOne({ email }) : null;

    if (user && !user.emailVerified) {
      const rawToken = await issueVerificationToken(user);
      const verifyUrl = `${APP_URL}/verify?token=${rawToken}`;
      const result = await sendVerificationEmail({ to: user.email, url: verifyUrl, name: user.name });
      console.log(`[auth/resend] verification send result for ${user.email}:`, result);
    }

    res.json({ ok: true, message: 'If that account needs verification, we sent a new link.' });
  } catch (err) { next(err); }
};

// The response is identical whether or not the address is registered, so this
// endpoint can't be used to enumerate accounts. That also hides a missing
// RESEND_API_KEY from the caller, hence the server-side log of the send result.
exports.forgotPassword = async (req, res, next) => {
  const generic = {
    ok: true,
    message: 'If an account exists for that email, we sent a reset link.',
  };
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (user?.email) {
      const rawToken = await issueResetToken(user);
      const resetUrl = `${APP_URL}/reset-password?token=${rawToken}`;
      const result = await sendPasswordResetEmail({ to: user.email, url: resetUrl, name: user.name });
      console.log(`[auth/forgot-password] reset send result for ${user.email}:`, result);
    }

    res.json(generic);
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token) return res.status(400).json({ message: 'Missing reset token.' });

    const user = await User.findOne({
      passwordResetTokenHash: hashToken(token),
      passwordResetExpiresAt: { $gt: new Date() },
    });
    if (!user) {
      return res.status(400).json({ message: 'That reset link is invalid or has expired.' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;

    // Reaching this point proves the user controls the inbox — the same proof
    // the verification link asks for — so clear any pending verification too.
    user.emailVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = undefined;

    // Drop the stored refresh token: if someone else was already signed in on
    // this account, the reset must end their session, not just change the
    // password they no longer need.
    user.refreshToken = undefined;

    await user.save();

    // Deliberately no cookies here — the user signs in with the new password.
    // Keeping this endpoint out of the session-minting business means a leaked
    // reset token alone never yields a live session.
    res.json({ ok: true, message: 'Password updated. You can now sign in.' });
  } catch (err) { next(err); }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.jid || req.body.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token' });

    const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(payload.id);
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const accessToken = createAccessToken({ id: user._id });

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000
    });

    res.json({ accessToken });
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    // Revoke the stored refresh token so it can't be replayed after logout.
    // The cookie is cleared below, but the token stays valid server-side (its
    // full 7-day life) unless we also clear it in the DB.
    const token = req.cookies?.jid || req.body?.refreshToken;
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        await User.updateOne({ _id: payload.id, refreshToken: token }, { $unset: { refreshToken: '' } });
      } catch {
        // expired/invalid token — nothing to revoke
      }
    }
    res.clearCookie('jid', { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax' });
    res.clearCookie('access_token', { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax' });
    res.json({ message: 'Logged out' });
  } catch (err) { next(err); }
};

exports.getMe = async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone,
    xp: req.user.xp,
    level: req.user.level,
    goals: req.user.goals ?? { sleep: 7, exercise: 4, mood: 3, water: 8 },
    reminderTimes: req.user.reminderTimes ?? { mood: '', sleep: '', water: '', exercise: '' },
    emailReminders: req.user.emailReminders ?? false,
    onboardingComplete: req.user.onboardingComplete ?? false,
    timezone: req.user.timezone ?? 'UTC',
  });
};
