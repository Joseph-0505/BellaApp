import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = process.env.BELLAAPP_BASE_URL ?? "https://bellaapp.local";
const password = "RedisValidation@123";
const email = `redis-validation-${Date.now()}@bellaapp.test`;
const maxDegradedResponseMs = 1_500;
const circuitCooldownMs = 31_000;

if (new URL(baseUrl).hostname === "bellaapp.local") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

function compose(...args) {
  return execFileSync("docker", ["compose", ...args], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
}

function docker(...args) {
  return execFileSync("docker", args, {
    cwd: repositoryRoot,
    encoding: "utf8",
  }).trim();
}

function generateCpf() {
  const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  const digit = (digits) => {
    const factor = digits.length + 1;
    const remainder = (digits.reduce(
      (sum, value, index) => sum + value * (factor - index),
      0,
    ) * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  const first = digit(base);
  const second = digit([...base, first]);
  return [...base, first, second].join("");
}

async function request(endpoint, options = {}) {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...options.headers,
    },
    signal: AbortSignal.timeout(20_000),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`${options.method ?? "GET"} ${endpoint} returned ${response.status}`);
  }
  return { payload, status: response.status };
}

async function waitForRedis() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      if (docker("inspect", "--format", "{{.State.Health.Status}}", "bellaapp-redis") === "healthy") {
        return;
      }
    } catch {
      // O container ainda está iniciando.
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error("Redis did not become healthy within 30 seconds");
}

async function listServices(authorization) {
  const startedAt = performance.now();
  const result = await request("/api/v1/services", {
    headers: { authorization },
  });
  return { ...result, ms: Math.round(performance.now() - startedAt) };
}

function assertLogged(logs, event) {
  const found = logs.includes(`"event":"${event}"`);
  console.log(`${event}_logged=${found}`);
  if (!found) {
    throw new Error(`Expected ${event} in backend logs`);
  }
}

async function validateFailure(name, failCommand, restoreCommand, authorization) {
  const since = new Date().toISOString();
  compose(failCommand, "redis");
  try {
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      const { ms, status } = await listServices(authorization);
      console.log(`redis_${name}_request_${attempt}_http=${status} ms=${ms}`);
      if (ms > maxDegradedResponseMs) {
        throw new Error(`Request took ${ms}ms with Redis ${name}`);
      }
    }
    const logs = compose("logs", "--since", since, "backend");
    assertLogged(logs, "cache.read_failed");
    assertLogged(logs, "redis.circuit_open");
  } finally {
    compose(restoreCommand, "redis");
    await waitForRedis();
  }

  await new Promise((resolve) => setTimeout(resolve, circuitCooldownMs));
  await listServices(authorization);
  const recovered = await listServices(authorization);
  console.log(`redis_${name}_recovered_http=${recovered.status} ms=${recovered.ms}`);
  assertLogged(compose("logs", "--since", since, "backend"), "redis.circuit_closed");
}

async function main() {
  await request("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Redis Validation",
      email,
      password,
      cpf: generateCpf(),
    }),
  });
  const { payload: login } = await request("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const authorization = `Bearer ${login.data.token}`;
  await request("/api/v1/onboarding/complete", {
    method: "POST",
    headers: { authorization },
    body: JSON.stringify({ businessName: "Redis Validation Clinic" }),
  });

  const baseline = await listServices(authorization);
  console.log(`redis_up_http=${baseline.status} ms=${baseline.ms}`);

  // "pause" simula um Redis travado; "stop", um Redis fora do ar.
  await validateFailure("frozen", "pause", "unpause", authorization);
  await validateFailure("stopped", "stop", "start", authorization);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
