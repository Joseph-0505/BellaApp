import assert from "node:assert/strict";
import test from "node:test";
import { DomainEventBridge, mapDomainEventToNotification } from "./domain-events";

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
    metadata: {
      clientId: "client-1",
      professionalId: "professional-1",
      scheduledAt: "2026-11-10T12:00:00.000Z",
      serviceId: "service-1",
    },
  });

  assert.equal(notification?.recipient, "clinic:clinic-1");
  assert.equal(notification?.subject, "Novo agendamento");
  assert.equal(notification?.metadata?.domainEventId, baseEvent.eventId);
  assert.equal(notification?.metadata?.clientId, "client-1");
  assert.equal(notification?.metadata?.professionalId, "professional-1");
  assert.equal(notification?.metadata?.serviceId, "service-1");
  assert.equal(
    notification?.metadata?.scheduledAt,
    "2026-11-10T12:00:00.000Z",
  );
});

test("ignora evento que nao gera notificacao", () => {
  const notification = mapDomainEventToNotification({
    ...baseEvent,
    type: "client.updated",
  });

  assert.equal(notification, null);
});

test("assinante enfileira e registra o mesmo identificador do evento", async () => {
  let listener: ((message: string) => Promise<void>) | undefined;
  const enqueued = [];
  const infoLogs: object[] = [];
  const subscriber = {
    async connect() {},
    async subscribe(_channel: string, callback: (message: string) => Promise<void>) {
      listener = callback;
    },
    async unsubscribe() {},
    async close() {},
  };
  const queue = {
    async enqueue(input: Record<string, unknown>) {
      enqueued.push(input);
      return {
        ...input,
        id: "0e3750a7-9be6-4713-a08a-c0a58dcd53bd",
        createdAt: "2026-11-09T12:00:01.000Z",
        attempt: 1,
      };
    },
  };
  const logger = {
    debug() {},
    error() {},
    info(payload: object) {
      infoLogs.push(payload);
    },
    warn() {},
  };
  const bridge = new DomainEventBridge(
    subscriber as never,
    queue as never,
    logger,
  );
  await bridge.start();

  assert.ok(listener);
  await listener(JSON.stringify({
    ...baseEvent,
    type: "appointment.created",
    metadata: {
      clientId: "client-1",
      professionalId: "professional-1",
      scheduledAt: "2026-11-10T12:00:00.000Z",
      serviceId: "service-1",
    },
  }));

  assert.equal(enqueued.length, 1);
  assert.equal(
    (enqueued[0] as { metadata: Record<string, unknown> }).metadata.domainEventId,
    baseEvent.eventId,
  );
  assert.ok(infoLogs.some((entry) => (
    entry as { event?: string; domainEventId?: string }
  ).event === "notification.enqueued_from_domain_event" && (
    entry as { domainEventId?: string }
  ).domainEventId === baseEvent.eventId));

  await bridge.stop();
});
