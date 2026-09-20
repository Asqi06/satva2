import mongoose from "mongoose";
import { requireServerVar } from "./env";

/**
 * Cached Mongoose connection (server-only).
 * Never import this module (or mongoose) from client components.
 */

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var __mongooseCache: MongooseCache | undefined;
}

function getCache(): MongooseCache {
  if (!globalThis.__mongooseCache) {
    globalThis.__mongooseCache = { conn: null, promise: null };
  }
  return globalThis.__mongooseCache;
}

/**
 * Connect to MongoDB (Atlas). Reuses the cached connection across
 * hot-reloads and serverless invocations. Fails fast with a clear
 * message when MONGODB_URI is missing.
 */
export async function connectDb(): Promise<typeof mongoose> {
  const cache = getCache();
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    const uri = requireServerVar("MONGODB_URI");
    cache.promise = mongoose.connect(uri);
  }
  cache.conn = await cache.promise;
  return cache.conn;
}

/** Test-only helper: clears the cached connection/promise. */
export function resetDbCache(): void {
  const cache = getCache();
  cache.conn = null;
  cache.promise = null;
}
