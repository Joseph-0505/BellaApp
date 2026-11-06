import { createHash } from "node:crypto";
import { env } from "../../config/env";
import { connectRedis, redis } from "../../lib/redis";

export type CacheNamespace =
  | "appointments"
  | "billing"
  | "cash"
  | "clients"
  | "onboarding"
  | "professionals"
  | "rooms"
  | "services"
  | "users";

type CacheLogger = {
  debug(payload: object, message?: string): void;
  info(payload: object, message?: string): void;
  warn(payload: object, message?: string): void;
};

type CacheClient = {
  del(key: string): Promise<number>;
  get(key: string): Promise<string | null>;
  incr(key: string): Promise<number>;
  set(key: string, value: string, options: { EX: number }): Promise<unknown>;
};

type CacheServiceOptions = {
  enabled: boolean;
  ensureConnection: () => Promise<void>;
  logger?: CacheLogger;
};

export type CacheQueryOptions = {
  clinicId: string;
  namespace: CacheNamespace;
  query?: unknown;
  scope?: string;
  ttlSeconds?: number;
};

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entryValue]) => [key, canonicalize(entryValue)]),
    );
  }

  return value;
}

function queryHash(query: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(query ?? {})))
    .digest("hex")
    .slice(0, 20);
}

function namespaceVersionKey(
  clinicId: string,
  namespace: CacheNamespace,
): string {
  return `bellaapp:cache-version:${clinicId}:${namespace}`;
}

export function buildCacheScope(context: {
  role: string;
  professionalId: string | null;
}): string {
  return `${context.role.toLowerCase()}:${context.professionalId ?? "all"}`;
}

export class CacheService {
  private logger: CacheLogger | undefined;

  constructor(
    private readonly client: CacheClient,
    private readonly options: CacheServiceOptions,
  ) {
    this.logger = options.logger;
  }

  setLogger(logger: CacheLogger): void {
    this.logger = logger;
  }

  private async getVersion(
    clinicId: string,
    namespace: CacheNamespace,
  ): Promise<string> {
    return (await this.client.get(namespaceVersionKey(clinicId, namespace))) ?? "0";
  }

  private async buildKey(options: CacheQueryOptions): Promise<string> {
    const version = await this.getVersion(options.clinicId, options.namespace);
    const scope = options.scope ?? "shared";
    return [
      "bellaapp",
      "v1",
      options.namespace,
      options.clinicId,
      scope,
      `v${version}`,
      queryHash(options.query),
    ].join(":");
  }

  async getOrSet<T>(
    options: CacheQueryOptions,
    loader: () => Promise<T>,
  ): Promise<T> {
    if (!this.options.enabled) {
      return loader();
    }

    let key: string;

    try {
      await this.options.ensureConnection();
      key = await this.buildKey(options);
      const cached = await this.client.get(key);

      if (cached !== null) {
        try {
          const value = JSON.parse(cached) as T;
          this.logger?.debug(
            { event: "cache.hit", key, namespace: options.namespace },
            "Cache hit",
          );
          return value;
        } catch (error) {
          await this.client.del(key);
          this.logger?.warn(
            { err: error, event: "cache.corrupt", key, namespace: options.namespace },
            "Invalid cached JSON removed",
          );
        }
      }

      this.logger?.debug(
        { event: "cache.miss", key, namespace: options.namespace },
        "Cache miss",
      );
    } catch (error) {
      this.logger?.warn(
        { err: error, event: "cache.read_failed", namespace: options.namespace },
        "Cache unavailable; loading from database",
      );
      return loader();
    }

    const value = await loader();

    try {
      await this.client.set(key, JSON.stringify(value), {
        EX: options.ttlSeconds ?? env.CACHE_DEFAULT_TTL_SECONDS,
      });
    } catch (error) {
      this.logger?.warn(
        { err: error, event: "cache.write_failed", key, namespace: options.namespace },
        "Could not write cache entry",
      );
    }

    return value;
  }

  async invalidate(
    clinicId: string,
    namespaces: CacheNamespace | CacheNamespace[],
  ): Promise<void> {
    if (!this.options.enabled) {
      return;
    }

    const namespaceList = Array.isArray(namespaces) ? namespaces : [namespaces];

    try {
      await this.options.ensureConnection();
      await Promise.all(
        namespaceList.map((namespace) =>
          this.client.incr(namespaceVersionKey(clinicId, namespace)),
        ),
      );
      this.logger?.info(
        { event: "cache.invalidated", clinicId, namespaces: namespaceList },
        "Cache namespaces invalidated",
      );
    } catch (error) {
      this.logger?.warn(
        { err: error, event: "cache.invalidation_failed", clinicId, namespaces: namespaceList },
        "Cache invalidation failed; TTL remains the safety net",
      );
    }
  }
}

export const cacheService = new CacheService(
  redis as unknown as CacheClient,
  {
    enabled: env.REDIS_ENABLED,
    ensureConnection: connectRedis,
  },
);
