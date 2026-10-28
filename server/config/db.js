const mongoose = require("mongoose");

async function connectDB() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in server environment variables");
  }

  mongoose.set("strictQuery", true);

  const conn = await mongoose.connect(process.env.MONGO_URI, {
    maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 10),
    minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 2),
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000
  });

  console.log(`MongoDB Connected: ${conn.connection.host}`);
}

module.exports = connectDB;
