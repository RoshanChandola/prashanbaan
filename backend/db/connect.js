const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prashanbaan';

let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log(`🍃 MongoDB connected: ${MONGO_URI.replace(/\/\/.*@/, '//<credentials>@')}`);

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.warn('⚠️  MongoDB disconnected — will reconnect automatically');
    });
    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      console.log('✅ MongoDB reconnected');
    });
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.warn('⚡ Server running in memory-only mode (no persistence)');
    // Don't crash — server works without DB, just no persistence
  }
}

function isDBConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDB, isDBConnected };
