import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import Fastify, { FastifyInstance } from "fastify";
import { env } from "../config/env";
import { registerErrorHandler } from "../shared/http/error-handler";
import { authRoutes } from "../modules/auth/auth.routes";
import { usersRoutes } from "../modules/users/users.routes";
import { clientsRoutes } from "../modules/clients/clients.routes";
import { servicesRoutes } from "../modules/services/services.routes";
import { appointmentsRoutes } from "../modules/appointments/appointments.routes";
import { professionalsRoutes } from "../modules/professionals/professionals.routes";
import { onboardingRoutes } from "../modules/onboarding/onboarding.routes";
import { roomsRoutes } from "../modules/rooms/rooms.routes";
import { billingsRoutes } from "../modules/billings/billings.routes";
import { cashRoutes } from "../modules/cash/cash.routes";
import { billingRoutes } from "../modules/billing/billing.routes";
import { prisma } from "../lib/prisma";
import { profileImagesRoutes } from "../modules/profile-images/profile-images.routes";
import { connectRedis, disconnectRedis, redis } from "../lib/redis";
import { cacheService } from "../shared/cache/cache.service";
import { domainEventBus } from "../shared/events/domain-event-bus";
import { healthRoutes } from "../modules/health/health.routes";

function resolveCorsOrigin(): true | string[] {
  if (env.CORS_ORIGIN === "*") {
    return true;
  }

  return env.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: env.NODE_ENV === "test"
      ? false
      : {
          level: env.LOG_LEVEL,
          redact: {
            paths: [
              "req.headers.authorization",
              "req.headers.cookie",
              "res.headers.set-cookie",
            ],
            censor: "[REDACTED]",
          },
        },
  });

  if (env.REDIS_ENABLED) {
    redis.on("error", (error) => {
      app.log.error({ err: error, component: "redis" }, "Redis client error");
    });
  }
  cacheService.setLogger(app.log);
  domainEventBus.setLogger(app.log);

  app.register(cors, {
    origin: resolveCorsOrigin(),
  });

  app.register(jwt, {
    secret: env.JWT_SECRET,
  });

  app.addHook("onRequest", async (request, reply) => {
    reply.header("X-Request-Id", request.id);
  });

  // fastify-multer 2.x usa o alias `multipart`, removido no Fastify 5.
  // Registramos o MIME completo e deixamos o stream intacto para o preHandler do Multer.
  app.addContentTypeParser("multipart/form-data", (_request, _payload, done) => {
    done(null, null);
  });

  registerErrorHandler(app);

  app.register(healthRoutes, { prefix: "/api/v1/health" });
  app.register(authRoutes, { prefix: "/api/v1/auth" });
  app.register(usersRoutes, { prefix: "/api/v1/users" });
  app.register(profileImagesRoutes, { prefix: "/api/v1/profile-images" });
  app.register(clientsRoutes, { prefix: "/api/v1/clients" });
  app.register(servicesRoutes, { prefix: "/api/v1/services" });
  app.register(professionalsRoutes, { prefix: "/api/v1/professionals" });
  app.register(onboardingRoutes, { prefix: "/api/v1/onboarding" });
  app.register(roomsRoutes, { prefix: "/api/v1/rooms" });
  app.register(appointmentsRoutes, { prefix: "/api/v1/appointments" });
  app.register(billingRoutes, { prefix: "/api/v1/billing" });
  app.register(billingsRoutes, { prefix: "/api/v1/cobrancas" });
  app.register(cashRoutes, { prefix: "/api/v1/caixa" });

  app.addHook("onReady", async () => {
    if (!env.REDIS_ENABLED) {
      app.log.info({ component: "redis" }, "Redis integration disabled");
      return;
    }

    await connectRedis();
    await domainEventBus.start();
    app.log.info({ component: "redis" }, "Redis connection ready");
  });

  app.addHook("onClose", async () => {
    await domainEventBus.stop();
    await Promise.all([
      disconnectRedis(),
      prisma.$disconnect(),
    ]);
  });

  return app;
}
