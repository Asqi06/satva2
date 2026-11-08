import mongoose from 'mongoose';

/**
 * Global is used here to maintain a cached connection across hot reloads in development
 * and serverless function invocations in production.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://SatvaStones:Satva1357..@ac-7qos0y9-shard-00-00.k0atuca.mongodb.net:27017,ac-7qos0y9-shard-00-01.k0atuca.mongodb.net:27017,ac-7qos0y9-shard-00-02.k0atuca.mongodb.net:27017/satvastones?retryWrites=true&w=majority&appName=SatvaStones&authSource=admin&replicaSet=atlas-11t6hn-shard-0&tls=true";

export async function connectDb() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
