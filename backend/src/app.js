require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const admin = require('firebase-admin');
const authRoutes = require('./routes/auth');
const habitRoutes = require('./routes/habits');
const moodRoutes = require('./routes/mood');
const sleepRoutes = require('./routes/sleep');
const waterRoutes = require('./routes/water');
const fitnessRoutes = require('./routes/fitness');
const insightRoutes = require('./routes/insights');
const settingsRoutes = require('./routes/settings');
const journalRoutes = require('./routes/journal');
const chatRoutes = require('./routes/chat');
const challengeRoutes = require('./routes/challenges');
const exportRoutes = require('./routes/export');
const errorHandler = require('./middlewares/errorHandler');

// Initialize Firebase Admin. verifyIdToken() only needs the project ID: it
// verifies each ID token's signature against Google's public certs and checks
// the `aud`/`iss` claims against this project. It MUST match the Firebase
// project the frontend mints tokens for (currently `lifeos-f9dc4`) — if it
// doesn't, every Google and phone sign-in is rejected with a generic 401.
// Set FIREBASE_PROJECT_ID on the server to override the fallback.
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'lifeos-f9dc4';
if (!process.env.FIREBASE_PROJECT_ID) {
  console.warn(
    '[firebase-admin] FIREBASE_PROJECT_ID is not set — defaulting to ' +
      `"${FIREBASE_PROJECT_ID}". Set it explicitly to the frontend Firebase project.`
  );
}
if (!admin.apps.length) {
  admin.initializeApp({ projectId: FIREBASE_PROJECT_ID });
}

const app = express();
app.disable('x-powered-by');

// Baseline security headers. CSP and cross-origin isolation are disabled: this
// is a JSON API consumed cross-origin by the browser frontend, and CORS (below)
// governs who may read responses — a restrictive CORP/COEP would break that.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://www.smarthabittracker.online',
  'https://lifeos-eight-xi.vercel.app',
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy and running.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/sleep', sleepRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/fitness', fitnessRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/export', exportRoutes);

app.use(errorHandler);

module.exports = app;
