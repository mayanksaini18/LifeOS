const crypto = require('crypto');
const Journal = require('../models/Journal');
const { isEnabled, getClient, getModel } = require('../services/ai');
const { resolveDayStart, startOfLocalDate } = require('../utils/time');

// POST /api/journal  — upsert today's entry
exports.saveEntry = async (req, res, next) => {
  try {
    const { content, date } = req.body;
    const day = resolveDayStart(date, req.user.timezone);

    const entry = await Journal.findOneAndUpdate(
      { user: req.user._id, date: day },
      { content },
      { upsert: true, new: true, runValidators: true }
    );
    res.status(201).json(entry);
  } catch (err) { next(err); }
};

// GET /api/journal  — list entries (newest first)
exports.getEntries = async (req, res, next) => {
  try {
    const { limit = 30, offset = 0 } = req.query;
    const entries = await Journal.find({ user: req.user._id })
      .sort({ date: -1 })
      .skip(Number(offset))
      .limit(Math.min(Number(limit), 100));
    res.json(entries);
  } catch (err) { next(err); }
};

// GET /api/journal/:date  — single entry by date (YYYY-MM-DD)
exports.getEntryByDate = async (req, res, next) => {
  try {
    const day = startOfLocalDate(req.params.date, req.user.timezone);
    const entry = await Journal.findOne({ user: req.user._id, date: day });
    if (!entry) return res.status(404).json({ message: 'No entry for this date' });
    res.json(entry);
  } catch (err) { next(err); }
};

// POST /api/journal/:id/analyze  — AI sentiment + summary + themes
exports.analyzeEntry = async (req, res, next) => {
  try {
    if (!isEnabled()) {
      return res.status(503).json({ message: 'AI is not configured' });
    }

    const entry = await Journal.findOne({ _id: req.params.id, user: req.user._id });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });

    const hash = crypto.createHash('sha1').update(entry.content).digest('hex');
    if (entry.aiContentHash === hash && entry.aiSummary) {
      return res.json({
        summary: entry.aiSummary,
        sentiment: entry.aiSentiment,
        themes: entry.aiThemes,
        cached: true,
      });
    }

    const response = await getClient().messages.create({
      model: getModel(),
      max_tokens: 400,
      system: `You analyze a user's journal entry and return strict JSON with:
- "summary": one sentence (max 25 words), second-person, warm, specific
- "sentiment": one of "positive", "neutral", "negative", "mixed"
- "themes": 1-4 short lowercase theme tags (e.g. "work stress", "gratitude", "sleep")

Respond with JSON only — no preamble, no code fences.`,
      messages: [{ role: 'user', content: entry.content }],
    });

    const text = response.content?.[0]?.type === 'text' ? response.content[0].text : '';
    let parsed;
    try {
      parsed = JSON.parse(text.trim().replace(/^```json\s*|\s*```$/g, ''));
    } catch {
      return res.status(502).json({ message: 'AI response was not valid JSON' });
    }

    const sentiment = ['positive', 'neutral', 'negative', 'mixed'].includes(parsed.sentiment)
      ? parsed.sentiment
      : 'neutral';
    const themes = Array.isArray(parsed.themes)
      ? parsed.themes.filter((t) => typeof t === 'string').slice(0, 4)
      : [];
    const summary = typeof parsed.summary === 'string' ? parsed.summary.slice(0, 300) : '';

    entry.aiSummary = summary;
    entry.aiSentiment = sentiment;
    entry.aiThemes = themes;
    entry.aiGeneratedAt = new Date();
    entry.aiContentHash = hash;
    await entry.save();

    res.json({ summary, sentiment, themes, cached: false });
  } catch (err) {
    console.error('[journal analyze]', err.message);
    next(err);
  }
};

// DELETE /api/journal/:id
exports.deleteEntry = async (req, res, next) => {
  try {
    const entry = await Journal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    res.json({ message: 'Entry deleted' });
  } catch (err) { next(err); }
};
