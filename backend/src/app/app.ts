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
    logger: env.NODE_ENV !== "test",
  });

  app.register(cors, {
    origin: resolveCorsOrigin(),
  });

  app.register(jwt, {
    secret: env.JWT_SECRET,
  });

  registerErrorHandler(app);

  app.register(authRoutes, { prefix: "/api/v1/auth" });
  app.register(usersRoutes, { prefix: "/api/v1/users" });
  app.register(clientsRoutes, { prefix: "/api/v1/clients" });
  app.register(servicesRoutes, { prefix: "/api/v1/services" });
  app.register(professionalsRoutes, { prefix: "/api/v1/professionals" });
  app.register(onboardingRoutes, { prefix: "/api/v1/onboarding" });
  app.register(roomsRoutes, { prefix: "/api/v1/rooms" });
  app.register(appointmentsRoutes, { prefix: "/api/v1/appointments" });
  app.register(billingRoutes, { prefix: "/api/v1/billing" });
  app.register(billingsRoutes, { prefix: "/api/v1/cobrancas" });
  app.register(cashRoutes, { prefix: "/api/v1/caixa" });

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });

  return app;
}
