require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { startScheduler } = require('./scheduler');

const PORT = process.env.PORT || 5000;

// Crash safety: on a shared/free-tier dyno a single unhandled rejection or a
// thrown error deep in an async handler would otherwise take the whole process
// down for every connected user. Log and (for uncaught exceptions) exit so the
// platform can restart cleanly, rather than continuing in an unknown state.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
  process.exit(1);
});

// Connect to Mongo BEFORE listening so we never advertise readiness while the
// DB is still connecting (which would queue requests) and never crash-after-listen.
connectDB()
  .then(() => {
    const server = app.listen(PORT, () => console.log(`Server running on ${PORT}`));
    startScheduler();

    // Graceful shutdown: stop accepting new connections and let in-flight
    // requests drain before the platform kills the process on redeploy.
    const shutdown = (signal) => {
      console.log(`[${signal}] shutting down…`);
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(0), 10000).unref();
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  })
  .catch((err) => {
    console.error('Startup failed — could not connect to MongoDB:', err.message);
    process.exit(1);
  });
