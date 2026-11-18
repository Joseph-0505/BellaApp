import { createClient } from "redis";
import { env } from "../config/env";
import { CircuitBreaker, withTimeout } from "../shared/resilience/circuit-breaker";

const REDIS_COMMAND_TIMEOUT_MS = 500;

export const redisCircuitBreaker = new CircuitBreaker({
  name: "redis",
  failureThreshold: 3,
  cooldownMs: 30_000,
  timeoutMs: REDIS_COMMAND_TIMEOUT_MS,
});

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

export async function ensureRedisForRequest(): Promise<void> {
  try {
    await connectRedis();
  } catch (error) {
    redisCircuitBreaker.recordFailure();
    throw error;
  }
}

// Ponto único dos comandos feitos durante uma requisição: um Redis travado aceita
// a conexão e nunca responde, então sem tempo limite a requisição ficaria presa.
export const guardedRedis = {
  get: (key: string) =>
    redisCircuitBreaker.execute(() => redis.get(key)),
  set: (key: string, value: string, options: { EX: number }) =>
    redisCircuitBreaker.execute(() =>
      redis.set(key, value, { expiration: { type: "EX", value: options.EX } }),
    ),
  del: (key: string) => redisCircuitBreaker.execute(() => redis.del(key)),
  // Invalidação ignora o circuito: perdê-la serviria dado antigo após a recuperação.
  incr: (key: string) =>
    redisCircuitBreaker.execute(() => redis.incr(key), { ignoreOpen: true }),
  publish: (channel: string, message: string) =>
    redisCircuitBreaker.execute(() => redis.publish(channel, message)),
};

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
  // Fora do circuito: o health check precisa informar o estado real do Redis.
  return withTimeout(redis.ping(), REDIS_COMMAND_TIMEOUT_MS, "redis ping");
}
