import { CacheService } from "../cache/cache.service";
import { CircuitBreaker, CircuitOpenError } from "./circuit-breaker";

const never = () => new Promise<never>(() => undefined);
const fail = async () => {
  throw new Error("redis unavailable");
};

function buildBreaker() {
  const clock = { value: 0 };
  const logger = { info: jest.fn(), warn: jest.fn() };
  const breaker = new CircuitBreaker({
    name: "redis",
    failureThreshold: 3,
    cooldownMs: 30_000,
    timeoutMs: 5,
    now: () => clock.value,
  });
  breaker.setLogger(logger);
  return { breaker, clock, logger };
}

async function openCircuit(breaker: CircuitBreaker) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await expect(breaker.execute(fail)).rejects.toThrow("redis unavailable");
  }
}

describe("CircuitBreaker", () => {
  it("abre após falhas seguidas e deixa de chamar a dependência", async () => {
    const { breaker, logger } = buildBreaker();
    await openCircuit(breaker);
    const operation = jest.fn().mockResolvedValue("ok");

    await expect(breaker.execute(operation)).rejects.toBeInstanceOf(
      CircuitOpenError,
    );

    expect(operation).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      { event: "redis.circuit_open" },
      expect.any(String),
    );
  });

  it("zera a contagem quando uma chamada dá certo", async () => {
    const { breaker } = buildBreaker();
    await expect(breaker.execute(fail)).rejects.toThrow();
    await expect(breaker.execute(fail)).rejects.toThrow();
    await breaker.execute(async () => "ok");
    await expect(breaker.execute(fail)).rejects.toThrow();

    await expect(breaker.execute(async () => "ok")).resolves.toBe("ok");
  });

  it("conta como falha a chamada que não responde no tempo limite", async () => {
    const { breaker } = buildBreaker();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await expect(breaker.execute(never)).rejects.toThrow("timed out");
    }

    await expect(breaker.execute(never)).rejects.toBeInstanceOf(
      CircuitOpenError,
    );
  });

  it("libera uma única chamada de teste após a espera e fecha com sucesso", async () => {
    const { breaker, clock, logger } = buildBreaker();
    await openCircuit(breaker);
    clock.value = 30_000;
    let finishProbe: (value: string) => void = () => undefined;
    const probe = breaker.execute(
      () => new Promise<string>((resolve) => { finishProbe = resolve; }),
    );

    await expect(breaker.execute(async () => "outra")).rejects.toBeInstanceOf(
      CircuitOpenError,
    );
    finishProbe("ok");

    await expect(probe).resolves.toBe("ok");
    await expect(breaker.execute(async () => "ok")).resolves.toBe("ok");
    expect(logger.info).toHaveBeenCalledWith(
      { event: "redis.circuit_closed" },
      expect.any(String),
    );
  });

  it("reabre quando a chamada de teste falha", async () => {
    const { breaker, clock } = buildBreaker();
    await openCircuit(breaker);
    clock.value = 30_000;
    await expect(breaker.execute(fail)).rejects.toThrow("redis unavailable");
    clock.value = 59_999;

    await expect(breaker.execute(async () => "ok")).rejects.toBeInstanceOf(
      CircuitOpenError,
    );
  });

  it("mantém a tentativa de invalidação com o circuito aberto", async () => {
    const { breaker } = buildBreaker();
    await openCircuit(breaker);

    await expect(
      breaker.execute(async () => 1, { ignoreOpen: true }),
    ).resolves.toBe(1);
  });

  it("faz o cache cair para a origem sem esperar um Redis travado", async () => {
    const { breaker } = buildBreaker();
    const get = jest.fn(never);
    const cache = new CacheService(
      {
        get: () => breaker.execute(() => get()),
        set: async () => "OK",
        del: async () => 1,
        incr: async () => 1,
      },
      { enabled: true, ensureConnection: async () => undefined },
    );
    const loader = jest.fn().mockResolvedValue({ data: [] });

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await expect(
        cache.getOrSet({ clinicId: "clinic-1", namespace: "services" }, loader),
      ).resolves.toEqual({ data: [] });
    }

    expect(loader).toHaveBeenCalledTimes(4);
    expect(get).toHaveBeenCalledTimes(3);
  });
});
