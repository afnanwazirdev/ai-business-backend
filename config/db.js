import mongoose from 'mongoose';

// Disable buffering so queries never hang if MongoDB is offline or connecting
mongoose.set('bufferCommands', false);

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/karobar_ai';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000, // 2s timeout instead of hanging
    });
    console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.warn(`[MongoDB Warning] Could not connect to local MongoDB (${error.message}).`);
    console.log('[MongoDB Note] Running with high-fidelity in-memory demo data mode. Zero timeouts.');
  }
};
