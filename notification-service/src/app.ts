import Fastify, { FastifyInstance } from "fastify";
import { createClient } from "redis";
import { env } from "./config";
import { notificationInputSchema } from "./notification";
import { NotificationQueue } from "./queue";

export function buildApp(
  redis: Pick<ReturnType<typeof createClient>, "ping">,
  queue: NotificationQueue,
): FastifyInstance {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      redact: {
        paths: ["req.headers.authorization", "req.headers.x-api-key"],
        censor: "[REDACTED]",
      },
    },
  });

  app.get("/health", async (_request, reply) => {
    try {
      const [redisStatus, queueStats] = await Promise.all([
        redis.ping(),
        queue.stats(),
      ]);
      return reply.code(200).send({
        status: "ok",
        service: "notification-service",
        dependencies: { redis: redisStatus === "PONG" ? "up" : "down" },
        queue: queueStats,
      });
    } catch (error) {
      app.log.error({ err: error }, "Notification service health check failed");
      return reply.code(503).send({
        status: "error",
        service: "notification-service",
        dependencies: { redis: "down" },
      });
    }
  });

  app.post("/api/v1/notifications", async (request, reply) => {
    const parsed = notificationInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "VALIDATION_ERROR",
        message: "Dados da notificacao invalidos.",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const job = await queue.enqueue(parsed.data);
    app.log.info(
      {
        event: "notification.enqueued",
        notificationId: job.id,
        channel: job.channel,
      },
      "Notification accepted",
    );
    return reply.code(202).send({ data: job });
  });

  return app;
}
