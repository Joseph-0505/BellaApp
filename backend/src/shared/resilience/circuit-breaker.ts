type CircuitLogger = {
  info(payload: object, message?: string): void;
  warn(payload: object, message?: string): void;
};

type CircuitBreakerOptions = {
  name: string;
  failureThreshold: number;
  cooldownMs: number;
  timeoutMs: number;
  now?: () => number;
};

export class CircuitOpenError extends Error {
  constructor(name: string) {
    super(`Circuit ${name} is open`);
    this.name = "CircuitOpenError";
  }
}

export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export class CircuitBreaker {
  private state: "closed" | "open" | "half_open" = "closed";
  private failures = 0;
  private openedAt = 0;
  private logger: CircuitLogger | undefined;
  private readonly now: () => number;

  constructor(private readonly options: CircuitBreakerOptions) {
    this.now = options.now ?? Date.now;
  }

  setLogger(logger: CircuitLogger): void {
    this.logger = logger;
  }

  private log(level: "info" | "warn", transition: string, message: string) {
    this.logger?.[level](
      { event: `${this.options.name}.circuit_${transition}` },
      message,
    );
  }

  private open(): void {
    this.state = "open";
    this.openedAt = this.now();
    this.log("warn", "open", "Circuit opened; skipping calls during cooldown");
  }

  private allowsCall(): boolean {
    if (this.state === "closed") {
      return true;
    }

    // Só uma chamada de teste por janela: as demais seguem sem esperar.
    if (this.now() - this.openedAt < this.options.cooldownMs) {
      return false;
    }

    this.openedAt = this.now();
    if (this.state === "open") {
      this.state = "half_open";
      this.log("info", "half_open", "Circuit testing the dependency");
    }
    return true;
  }

  recordSuccess(): void {
    this.failures = 0;

    if (this.state !== "closed") {
      this.state = "closed";
      this.log("info", "closed", "Circuit closed; dependency recovered");
    }
  }

  recordFailure(): void {
    if (this.state === "half_open") {
      this.open();
      return;
    }

    if (this.state === "closed") {
      this.failures += 1;
      if (this.failures >= this.options.failureThreshold) {
        this.open();
      }
    }
  }

  async execute<T>(
    operation: () => Promise<T>,
    options: { ignoreOpen?: boolean } = {},
  ): Promise<T> {
    if (!this.allowsCall() && !options.ignoreOpen) {
      throw new CircuitOpenError(this.options.name);
    }

    try {
      const result = await withTimeout(
        operation(),
        this.options.timeoutMs,
        this.options.name,
      );
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
}
