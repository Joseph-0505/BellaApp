import assert from "node:assert/strict";
import test from "node:test";
import { mapDomainEventToNotification } from "./domain-events";

const baseEvent = {
  eventId: "f4d2795f-21da-43bb-b6b8-f63bf98ec76e",
  clinicId: "clinic-1",
  aggregateId: "appointment-1",
  actorId: "user-1",
  occurredAt: "2026-11-05T12:00:00.000Z",
};

test("converte evento de agendamento em notificacao de fila", () => {
  const notification = mapDomainEventToNotification({
    ...baseEvent,
    type: "appointment.created",
  });

  assert.equal(notification?.recipient, "clinic:clinic-1");
  assert.equal(notification?.subject, "Novo agendamento");
  assert.equal(notification?.metadata?.domainEventId, baseEvent.eventId);
});

test("ignora evento que nao gera notificacao", () => {
  const notification = mapDomainEventToNotification({
    ...baseEvent,
    type: "client.updated",
  });

  assert.equal(notification, null);
});
