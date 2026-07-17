const ChatMessage = require('../models/ChatMessage');
const Mood = require('../models/Mood');
const Sleep = require('../models/Sleep');
const Water = require('../models/Water');
const Fitness = require('../models/Fitness');
const Habit = require('../models/Habit');
const Journal = require('../models/Journal');
const { isEnabled, getClient, getModel } = require('../services/ai');

const HISTORY_LIMIT = 20;
const CONTEXT_DAYS = 7;

async function buildUserContext(userId) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - CONTEXT_DAYS);
  since.setUTCHours(0, 0, 0, 0);

  const [moods, sleeps, waters, fitness, habits, journals] = await Promise.all([
    Mood.find({ user: userId, date: { $gte: since } }).sort({ date: 1 }).lean(),
    Sleep.find({ user: userId, date: { $gte: since } }).sort({ date: 1 }).lean(),
    Water.find({ user: userId, date: { $gte: since } }).sort({ date: 1 }).lean(),
    Fitness.find({ user: userId, date: { $gte: since } }).sort({ date: 1 }).lean(),
    Habit.find({ user: userId, isActive: true }).lean(),
    Journal.find({ user: userId, date: { $gte: since } }).sort({ date: 1 }).lean(),
  ]);

  const fmt = (d) => new Date(d).toISOString().slice(0, 10);

  const summary = {
    mood: moods.map((m) => ({ date: fmt(m.date), score: m.score, tags: m.tags })),
    sleep: sleeps.map((s) => ({ date: fmt(s.date), hours: s.duration, quality: s.quality })),
    water: waters.map((w) => ({ date: fmt(w.date), glasses: w.glasses, goal: w.goal })),
    exercise: fitness.map((f) => ({
      date: fmt(f.date),
      minutes: f.totalDuration,
      calories: f.totalCalories,
      count: f.exercises?.length || 0,
    })),
    habits: habits.map((h) => {
      const recent = (h.checkins || []).filter((c) => new Date(c.date) >= since).length;
      return { title: h.title, streak: h.streak, completionsLast7Days: recent };
    }),
    journal: journals.map((j) => ({ date: fmt(j.date), content: j.content.slice(0, 400) })),
  };

  return summary;
}

function systemPrompt(context) {
  return `You are LifeOS, a warm, concise wellness coach inside a personal health tracking app.

You have access to the user's last ${CONTEXT_DAYS} days of logged data. Use it to give specific, grounded advice — reference actual numbers and patterns from their data when relevant. Do not invent data that isn't shown.

Guidelines:
- Keep responses short (2-5 sentences unless the user asks for more).
- Be supportive, not preachy. No medical diagnoses.
- When the user asks "how am I doing?" or similar, ground your answer in the data below.
- If the data is sparse, acknowledge that and encourage logging rather than speculating.

USER DATA (last ${CONTEXT_DAYS} days):
${JSON.stringify(context, null, 2)}`;
}

exports.sendMessage = async (req, res, next) => {
  try {
    if (!isEnabled()) {
      return res.status(503).json({ message: 'AI chat not configured' });
    }

    const { message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const userId = req.user._id;

    await ChatMessage.create({ user: userId, role: 'user', content: message.trim() });

    const history = await ChatMessage.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(HISTORY_LIMIT)
      .lean();
    const ordered = history.reverse();

    const context = await buildUserContext(userId);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const messages = ordered.map((m) => ({ role: m.role, content: m.content }));

    let full = '';
    let ended = false;
    let aborted = false;

    // Idempotent teardown: the stream's 'error' and 'end' can both fire, and
    // writing to / ending an already-ended response throws (and previously
    // risked crashing the process). Only the first call does anything.
    const finish = (payload) => {
      if (ended) return;
      ended = true;
      try {
        if (payload) res.write(`data: ${JSON.stringify(payload)}\n\n`);
        res.end();
      } catch { /* socket already gone */ }
    };

    const stream = await getClient().messages.stream({
      model: getModel(),
      max_tokens: 1024,
      system: systemPrompt(context),
      messages,
    });

    // If the client disconnects mid-stream, stop paying for the generation.
    req.on('close', () => {
      if (!ended) {
        aborted = true;
        try { stream.abort?.(); } catch { /* ignore */ }
      }
    });

    stream.on('text', (delta) => {
      if (ended) return;
      full += delta;
      try {
        res.write(`data: ${JSON.stringify({ type: 'delta', text: delta })}\n\n`);
      } catch { ended = true; }
    });

    stream.on('error', (err) => {
      console.error('[chat] stream error:', err.message);
      finish({ type: 'error', message: 'Stream error' });
    });

    stream.on('end', async () => {
      // Persist the assistant reply only for a completed (non-aborted) stream.
      if (!aborted && full.trim()) {
        try {
          await ChatMessage.create({ user: userId, role: 'assistant', content: full });
        } catch (e) {
          console.error('[chat] save error:', e.message);
        }
      }
      finish({ type: 'done' });
    });
  } catch (err) { next(err); }
};

exports.getHistory = async (req, res, next) => {
  try {
    const messages = await ChatMessage.find({ user: req.user._id })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();
    res.json({ messages });
  } catch (err) { next(err); }
};

exports.clearHistory = async (req, res, next) => {
  try {
    await ChatMessage.deleteMany({ user: req.user._id });
    res.json({ message: 'Chat history cleared' });
  } catch (err) { next(err); }
};
