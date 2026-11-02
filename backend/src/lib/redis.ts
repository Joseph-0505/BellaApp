import { createClient } from "redis";
import { env } from "../config/env";

export const redis = createClient({
  url: env.REDIS_URL,
  socket: {
    connectTimeout: 5_000,
    reconnectStrategy(retries) {
      return Math.min(retries * 100, 3_000);
    },
  },
});

let connectionPromise: ReturnType<typeof redis.connect> | null = null;

export async function connectRedis(): Promise<void> {
  if (!env.REDIS_ENABLED || redis.isReady) {
    return;
  }

  if (!connectionPromise) {
    connectionPromise = redis.connect().finally(() => {
      connectionPromise = null;
    });
  }

  await connectionPromise;
}

export async function disconnectRedis(): Promise<void> {
  if (!redis.isOpen) {
    return;
  }

  await redis.close();
}

export async function pingRedis(): Promise<string> {
  if (!env.REDIS_ENABLED) {
    return "DISABLED";
  }

  await connectRedis();
  return redis.ping();
}
