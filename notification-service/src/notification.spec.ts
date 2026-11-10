import assert from "node:assert/strict";
import test from "node:test";
import {
  createNotificationJob,
  notificationInputSchema,
  notificationJobSchema,
} from "./notification";

test("cria uma notificacao rastreavel", () => {
  const input = notificationInputSchema.parse({
    channel: "email",
    recipient: "cliente@example.com",
    subject: "Agendamento confirmado",
    message: "Seu horario foi confirmado.",
  });
  const job = createNotificationJob(input);

  assert.equal(notificationJobSchema.safeParse(job).success, true);
  assert.match(job.id, /^[0-9a-f-]{36}$/);
  assert.equal(job.attempt, 1);
});

test("rejeita destinatario invalido para e-mail", () => {
  const result = notificationInputSchema.safeParse({
    channel: "email",
    recipient: "nao-e-email",
    subject: "Assunto",
    message: "Mensagem",
  });

  assert.equal(result.success, false);
});
