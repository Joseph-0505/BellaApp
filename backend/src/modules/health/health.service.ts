import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { pingRedis } from "../../lib/redis";
import { DependencyHealth, HealthResponseDto } from "./health.dtos";

async function checkDependency(
  check: () => Promise<unknown>,
): Promise<DependencyHealth> {
  const startedAt = performance.now();

  try {
    await check();
    return {
      latencyMs: Math.round(performance.now() - startedAt),
      status: "up",
    };
  } catch {
    return {
      latencyMs: Math.round(performance.now() - startedAt),
      status: "down",
    };
  }
}

class HealthService {
  async check(): Promise<HealthResponseDto> {
    const [mysql, redis] = await Promise.all([
      checkDependency(async () => prisma.$queryRaw`SELECT 1`),
      env.REDIS_ENABLED
        ? checkDependency(pingRedis)
        : Promise.resolve<DependencyHealth>({ latencyMs: 0, status: "disabled" }),
    ]);
    const healthy = mysql.status === "up" && redis.status !== "down";

    return {
      status: healthy ? "ok" : "down",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      dependencies: { mysql, redis },
    };
  }
}

export const healthService = new HealthService();
