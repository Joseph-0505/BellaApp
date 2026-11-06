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
    const cache = new CacheService(client, {
      enabled: true,
      ensureConnection: async () => undefined,
    });
    const loader = jest.fn().mockResolvedValue({ data: ["service-1"] });
    const options = {
      clinicId: "clinic-1",
      namespace: "services" as const,
      query: { page: 1, search: "laser" },
      ttlSeconds: 45,
    };

    await expect(cache.getOrSet(options, loader)).resolves.toEqual({ data: ["service-1"] });
    await expect(cache.getOrSet(options, loader)).resolves.toEqual({ data: ["service-1"] });

    expect(loader).toHaveBeenCalledTimes(1);
    expect(client.expirations[0]?.seconds).toBe(45);
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
    const cache = new CacheService(client, {
      enabled: true,
      ensureConnection: async () => undefined,
    });
    const loader = jest.fn().mockResolvedValue({ data: [] });

    await expect(cache.getOrSet({
      clinicId: "clinic-1",
      namespace: "clients",
    }, loader)).resolves.toEqual({ data: [] });

    expect(loader).toHaveBeenCalledTimes(1);
  });
});
