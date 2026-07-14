const mongoose = require('mongoose');

module.exports = async function connectDB() {
  // serverSelectionTimeoutMS caps how long a hung/unreachable cluster blocks
  // startup (default is 30s); the caller (index.js) handles the rejection.
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  console.log('MongoDB connected');
};
