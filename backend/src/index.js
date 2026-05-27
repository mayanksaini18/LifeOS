require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const admin = require('firebase-admin');
const connectDB = require('./config/db');
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
const { startScheduler } = require('./scheduler');

// Initialize Firebase Admin (uses default credentials or service account)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'smart-habit-tracker-39269',
  });
}

const app = express();
connectDB();

const MONGO_URI = 'mongodb+srv://mayanksaini0416_db_user:%40Mayank0416@cluster0.v0rdlpc.mongodb.net/smart-health-tracker';
console.log('MONGO_URI:', MONGO_URI);

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
startScheduler();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
