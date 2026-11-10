import { createClient } from "redis";
import { buildApp } from "./app";
import { env } from "./config";
import { NotificationDelivery } from "./delivery";
import { DomainEventBridge } from "./domain-events";
import { NotificationQueue, NotificationWorker } from "./queue";

async function start(): Promise<void> {
  const redis = createClient({ url: env.REDIS_URL });
  const workerRedis = redis.duplicate();
  const subscriberRedis = redis.duplicate();
  const producerQueue = new NotificationQueue(redis);
  const workerQueue = new NotificationQueue(workerRedis);

  await Promise.all([redis.connect(), workerRedis.connect()]);

  const app = buildApp(redis, producerQueue);
  const delivery = new NotificationDelivery(app.log);
  const worker = new NotificationWorker(
    workerQueue,
    (job) => delivery.send(job),
    app.log,
  );
  const bridge = new DomainEventBridge(subscriberRedis, producerQueue, app.log);

  redis.on("error", (error) => app.log.error({ err: error, component: "redis-producer" }, "Redis error"));
  workerRedis.on("error", (error) => app.log.error({ err: error, component: "redis-worker" }, "Redis error"));
  subscriberRedis.on("error", (error) => app.log.error({ err: error, component: "redis-subscriber" }, "Redis error"));

  await worker.start();
  await bridge.start();
  await app.listen({ host: env.HOST, port: env.PORT });

  let stopping = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (stopping) return;
    stopping = true;
    app.log.info({ signal }, "Stopping notification service");

    await app.close();
    await bridge.stop();
    await worker.stop();
    await Promise.all([workerRedis.close(), redis.close()]);
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
}

start().catch((error) => {
  console.error("Failed to start notification service", error);
  process.exit(1);
});
