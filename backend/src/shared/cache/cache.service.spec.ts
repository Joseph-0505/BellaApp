import { CacheService } from "./cache.service";

class FakeCacheClient {
  readonly values = new Map<string, string>();
  readonly expirations: Array<{ key: string; seconds: number }> = [];
  failReads = false;

  async get(key: string): Promise<string | null> {
    if (this.failReads) throw new Error("redis unavailable");
    return this.values.get(key) ?? null;
  }

  async set(key: string, value: string, options: { EX: number }): Promise<string> {
    this.values.set(key, value);
    this.expirations.push({ key, seconds: options.EX });
    return "OK";
  }

  async del(key: string): Promise<number> {
    return this.values.delete(key) ? 1 : 0;
  }

  async incr(key: string): Promise<number> {
    const nextValue = Number(this.values.get(key) ?? "0") + 1;
    this.values.set(key, String(nextValue));
    return nextValue;
  }
}

describe("CacheService", () => {
  it("usa cache-aside com TTL e reutiliza o valor armazenado", async () => {
    const client = new FakeCacheClient();
    const logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };
    const cache = new CacheService(client, {
      enabled: true,
      ensureConnection: async () => undefined,
      logger,
    });
    const loader = jest.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
      return { data: ["service-1"] };
    });
    const options = {
      clinicId: "clinic-1",
      namespace: "services" as const,
      query: { page: 1, search: "laser" },
      ttlSeconds: 45,
    };

    const firstStartedAt = performance.now();
    await expect(cache.getOrSet(options, loader)).resolves.toEqual({ data: ["service-1"] });
    const firstDuration = performance.now() - firstStartedAt;
    const secondStartedAt = performance.now();
    await expect(cache.getOrSet(options, loader)).resolves.toEqual({ data: ["service-1"] });
    const secondDuration = performance.now() - secondStartedAt;

    expect(loader).toHaveBeenCalledTimes(1);
    expect(client.expirations[0]?.seconds).toBe(45);
    expect(secondDuration).toBeLessThan(firstDuration);
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({ event: "cache.miss", namespace: "services" }),
      "Cache miss",
    );
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({ event: "cache.hit", namespace: "services" }),
      "Cache hit",
    );
  });

  it("troca a versao do namespace e força nova leitura após invalidacao", async () => {
    const client = new FakeCacheClient();
    const cache = new CacheService(client, {
      enabled: true,
      ensureConnection: async () => undefined,
    });
    const loader = jest
      .fn()
      .mockResolvedValueOnce({ version: 1 })
      .mockResolvedValueOnce({ version: 2 });
    const options = {
      clinicId: "clinic-1",
      namespace: "appointments" as const,
      query: { date: "2026-11-02" },
    };

    await expect(cache.getOrSet(options, loader)).resolves.toEqual({ version: 1 });
    await cache.invalidate("clinic-1", "appointments");
    await expect(cache.getOrSet(options, loader)).resolves.toEqual({ version: 2 });

    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("faz fail-open e consulta a origem quando o Redis falha", async () => {
    const client = new FakeCacheClient();
    client.failReads = true;
    const logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };
    const cache = new CacheService(client, {
      enabled: true,
      ensureConnection: async () => undefined,
      logger,
    });
    const loader = jest.fn().mockResolvedValue({ data: [] });

    await expect(cache.getOrSet({
      clinicId: "clinic-1",
      namespace: "clients",
    }, loader)).resolves.toEqual({ data: [] });

    expect(loader).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "cache.read_failed",
        namespace: "clients",
      }),
      "Cache unavailable; loading from database",
    );
  });

  it("isola entradas iguais por clinica", async () => {
    const client = new FakeCacheClient();
    const cache = new CacheService(client, {
      enabled: true,
      ensureConnection: async () => undefined,
    });
    const clinicOneLoader = jest.fn().mockResolvedValue({ data: ["clinic-1-service"] });
    const clinicTwoLoader = jest.fn().mockResolvedValue({ data: ["clinic-2-service"] });
    const commonOptions = {
      namespace: "services" as const,
      query: { page: 1, limit: 10 },
    };

    await expect(cache.getOrSet(
      { ...commonOptions, clinicId: "clinic-1" },
      clinicOneLoader,
    )).resolves.toEqual({ data: ["clinic-1-service"] });
    await expect(cache.getOrSet(
      { ...commonOptions, clinicId: "clinic-2" },
      clinicTwoLoader,
    )).resolves.toEqual({ data: ["clinic-2-service"] });
    await cache.getOrSet(
      { ...commonOptions, clinicId: "clinic-1" },
      clinicOneLoader,
    );
    await cache.getOrSet(
      { ...commonOptions, clinicId: "clinic-2" },
      clinicTwoLoader,
    );

    expect(clinicOneLoader).toHaveBeenCalledTimes(1);
    expect(clinicTwoLoader).toHaveBeenCalledTimes(1);
  });

  it("volta a usar o cache quando o Redis se recupera", async () => {
    const client = new FakeCacheClient();
    client.failReads = true;
    const cache = new CacheService(client, {
      enabled: true,
      ensureConnection: async () => undefined,
    });
    const loader = jest
      .fn()
      .mockResolvedValueOnce({ source: "database-during-outage" })
      .mockResolvedValueOnce({ source: "database-after-recovery" });
    const options = {
      clinicId: "clinic-1",
      namespace: "services" as const,
    };

    await expect(cache.getOrSet(options, loader)).resolves.toEqual({
      source: "database-during-outage",
    });
    client.failReads = false;
    await expect(cache.getOrSet(options, loader)).resolves.toEqual({
      source: "database-after-recovery",
    });
    await expect(cache.getOrSet(options, loader)).resolves.toEqual({
      source: "database-after-recovery",
    });

    expect(loader).toHaveBeenCalledTimes(2);
  });
});
