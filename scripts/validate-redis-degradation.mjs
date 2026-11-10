import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = process.env.BELLAAPP_BASE_URL ?? "https://bellaapp.local";
const password = "RedisValidation@123";
const email = `redis-validation-${Date.now()}@bellaapp.test`;

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

  const baseline = await request("/api/v1/services", {
    headers: { authorization },
  });
  console.log(`redis_up_http=${baseline.status}`);

  compose("stop", "redis");
  try {
    const degraded = await request("/api/v1/services", {
      headers: { authorization },
    });
    console.log(`redis_down_http=${degraded.status}`);
    const logs = compose("logs", "--since", "2m", "backend");
    const failureLogged = logs.includes("cache.read_failed");
    console.log(`cache_read_failed_logged=${failureLogged}`);
    if (!failureLogged) {
      throw new Error("Expected cache.read_failed in backend logs");
    }
  } finally {
    compose("start", "redis");
    await waitForRedis();
  }

  const recovered = await request("/api/v1/services", {
    headers: { authorization },
  });
  const cachedAgain = await request("/api/v1/services", {
    headers: { authorization },
  });
  console.log(`redis_recovered_http=${recovered.status}`);
  console.log(`redis_reused_http=${cachedAgain.status}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
