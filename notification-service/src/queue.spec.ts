import assert from "node:assert/strict";
import test from "node:test";
import { env } from "./config";
import { createNotificationJob } from "./notification";
import { NotificationQueue, NotificationWorker } from "./queue";

const logger = { info() {}, warn() {}, error() {} };

async function processWith(attempt: number, handler: () => Promise<void>): Promise<string[]> {
  const calls: string[] = [];
  const queue = {
    parse: NotificationQueue.prototype.parse,
    async acknowledge() { calls.push("ack"); },
    async retry(_id: string, job: { attempt: number }) { calls.push(`retry:${job.attempt}`); },
    async moveToDeadLetter() { calls.push("dead-letter"); },
  };
  const job = {
    ...createNotificationJob({ channel: "email", recipient: "maria@example.com", subject: "Teste", message: "Oi" }),
    attempt,
  };
  const worker = new NotificationWorker(queue as never, handler, logger as never);
  // process é privado; o teste exercita uma mensagem sem subir o loop do Redis.
  await (worker as unknown as { process(message: unknown): Promise<void> }).process({
    id: "1-0",
    message: { job: JSON.stringify(job) },
  });
  return calls;
}

const fail = async () => { throw new Error("SMTP fora do ar"); };

test("entrega com sucesso confirma a mensagem", async () => {
  assert.deepEqual(await processWith(1, async () => {}), ["ack"]);
});

test("falha antes do limite reenfileira a notificacao", async () => {
  assert.deepEqual(await processWith(1, fail), ["retry:1"]);
});

test("falha na ultima tentativa vai para a dead-letter", async () => {
  assert.deepEqual(await processWith(env.NOTIFICATION_MAX_ATTEMPTS, fail), ["dead-letter"]);
});
