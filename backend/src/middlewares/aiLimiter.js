const rateLimit = require('express-rate-limit');

// Per-user cap on the paid Anthropic endpoints (chat, journal analyze, weekly
// insights). Keyed by authenticated user id when available so one user can't
// exhaust the shared quota; falls back to IP for any unauthenticated hit.
// Without this, a loop or a leaked token drives unbounded API spend and
// saturates the single dyno.
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user?._id ? String(req.user._id) : req.ip),
  message: { message: 'You’re sending requests too quickly. Please wait a moment and try again.' },
});

module.exports = { aiLimiter };
