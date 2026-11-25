import assert from "node:assert/strict";
import test from "node:test";
import { buildAppointmentReminder, syncAppointmentReminder } from "./domain-events";
import { NotificationInput } from "./notification";
import { REMINDER_LEAD_MS, ReminderScheduler } from "./reminders";

function fakeRedis() {
  const zset = new Map<string, number>();
  const hash = new Map<string, string>();
  return {
    async zAdd(_key: string, entry: { score: number; value: string }) { zset.set(entry.value, entry.score); return 1; },
    async zRem(_key: string, member: string) { return zset.delete(member) ? 1 : 0; },
    async zRangeByScore(_key: string, min: number, max: number) {
      return [...zset].filter(([, score]) => score >= min && score <= max).map(([value]) => value);
    },
    async hSet(_key: string, field: string, value: string) { hash.set(field, value); return 1; },
    async hGet(_key: string, field: string) { return hash.get(field) ?? null; },
    async hDel(_key: string, field: string) { return hash.delete(field) ? 1 : 0; },
  };
}

function setup() {
  const enqueued: NotificationInput[] = [];
  const queue = { async enqueue(input: NotificationInput) { enqueued.push(input); return input as never; } };
  return { enqueued, reminders: new ReminderScheduler(fakeRedis() as never, queue) };
}

const now = Date.parse("2026-11-24T12:00:00.000Z");
const day = 24 * 60 * 60 * 1000;

function appointmentEvent(type: string, scheduledAt: number, extra: Record<string, unknown> = {}) {
  return {
    eventId: "f4d2795f-21da-43bb-b6b8-f63bf98ec76e",
    type,
    clinicId: "clinic-1",
    aggregateId: "appointment-1",
    actorId: "user-1",
    occurredAt: new Date(now).toISOString(),
    metadata: {
      clientEmail: "maria@example.com",
      clientName: "Maria",
      serviceName: "Limpeza de pele",
      professionalName: "Ana",
      scheduledAt: new Date(scheduledAt).toISOString(),
      status: "CONFIRMED",
      ...extra,
    },
  };
}

test("lembrete sai 24h antes do horario e so quando vence", async () => {
  const { enqueued, reminders } = setup();
  const scheduledAt = now + 3 * day;
  await syncAppointmentReminder(reminders, appointmentEvent("appointment.created", scheduledAt), now);

  assert.equal(await reminders.releaseDue(scheduledAt - REMINDER_LEAD_MS - 1), 0);
  assert.equal(await reminders.releaseDue(scheduledAt - REMINDER_LEAD_MS), 1);
  assert.equal(enqueued[0]?.channel, "email");
  assert.equal(enqueued[0]?.recipient, "maria@example.com");
  assert.match(enqueued[0]?.subject ?? "", /^Lembrete: seu horário de Limpeza de pele é amanhã$/);
  assert.equal(await reminders.releaseDue(scheduledAt), 0, "o mesmo lembrete nao sai duas vezes");
});

test("remarcacao move o lembrete e o horario antigo nao envia nada", async () => {
  const { enqueued, reminders } = setup();
  const oldAt = now + 3 * day;
  const newAt = now + 5 * day;
  await syncAppointmentReminder(reminders, appointmentEvent("appointment.created", oldAt), now);
  await syncAppointmentReminder(reminders, appointmentEvent("appointment.updated", newAt), now);

  assert.equal(await reminders.releaseDue(oldAt - REMINDER_LEAD_MS), 0);
  assert.equal(await reminders.releaseDue(newAt - REMINDER_LEAD_MS), 1);
  assert.equal(enqueued.length, 1);
});

test("cancelamento, conclusao ou remocao tiram o lembrete", async () => {
  for (const event of [
    appointmentEvent("appointment.updated", now + 3 * day, { status: "CANCELED" }),
    { ...appointmentEvent("appointment.completed", now + 3 * day), metadata: undefined },
    { ...appointmentEvent("appointment.deleted", now + 3 * day), metadata: undefined },
  ]) {
    const { enqueued, reminders } = setup();
    await syncAppointmentReminder(reminders, appointmentEvent("appointment.created", now + 3 * day), now);
    await syncAppointmentReminder(reminders, event, now);
    assert.equal(await reminders.releaseDue(now + 10 * day), 0, event.type);
    assert.equal(enqueued.length, 0);
  }
});

test("agendamento a menos de 24h ou sem e-mail nao gera lembrete", () => {
  assert.equal(buildAppointmentReminder(appointmentEvent("appointment.created", now + 2 * 60 * 60 * 1000), now), null);
  assert.equal(buildAppointmentReminder(appointmentEvent("appointment.created", now + 3 * day, { clientEmail: null }), now), null);
});
