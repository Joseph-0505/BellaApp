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

test("agendamento novo de cliente com e-mail vira e-mail para o cliente", () => {
  const notification = mapDomainEventToNotification({
    ...baseEvent,
    type: "appointment.created",
    metadata: {
      clientEmail: "maria@example.com",
      clientName: "Maria <Silva>",
      serviceName: "Limpeza de pele",
      professionalName: "Ana",
      scheduledAt: "2026-11-10T12:00:00.000Z",
      status: "SCHEDULED",
    },
  });

  assert.equal(notification?.channel, "email");
  assert.equal(notification?.recipient, "maria@example.com");
  assert.equal(notification?.subject, "Seu horário está agendado: Limpeza de pele");
  // 12:00 UTC = 09:00 em Brasília
  assert.match(notification?.message ?? "", /Quando: .*10 de novembro de 2026.*09:00/);
  assert.match(notification?.message ?? "", /Profissional: Ana/);
  assert.match(notification?.html ?? "", /Maria &lt;Silva&gt;/);
  assert.equal(notification?.metadata?.domainEventId, baseEvent.eventId);
});

// KAN-84: o appointment.updated leva o estado anterior; o horário fica no futuro para valer em qualquer data.
// Um valor só: duas chamadas a Date.now() podem cair em milissegundos diferentes e parecer remarcação.
const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
const updatedEvent = (metadata: Record<string, unknown>) => ({
  ...baseEvent,
  type: "appointment.updated",
  metadata: {
    clientEmail: "maria@example.com",
    clientName: "Maria",
    serviceName: "Limpeza de pele",
    professionalName: "Ana",
    scheduledAt: inThreeDays,
    status: "SCHEDULED",
    previousScheduledAt: inThreeDays,
    previousStatus: "SCHEDULED",
    ...metadata,
  },
});

test("cancelar um agendamento futuro em aberto vira e-mail de cancelamento", () => {
  const notification = mapDomainEventToNotification(updatedEvent({ status: "CANCELED" }));

  assert.equal(notification?.channel, "email");
  assert.equal(notification?.recipient, "maria@example.com");
  assert.equal(notification?.subject, "Seu horário foi cancelado: Limpeza de pele");
});

test("remarcar vira e-mail com o horario novo e o anterior", () => {
  const notification = mapDomainEventToNotification(
    updatedEvent({ scheduledAt: "2030-01-10T15:00:00.000Z", previousScheduledAt: "2030-01-09T12:00:00.000Z" }),
  );

  assert.equal(notification?.channel, "email");
  assert.equal(notification?.subject, "Seu horário foi remarcado: Limpeza de pele");
  // 15:00 e 12:00 UTC = 12:00 e 09:00 em Brasília
  assert.match(notification?.message ?? "", /antes era .*9 de janeiro de 2030.*09:00/);
  assert.match(notification?.message ?? "", /Quando: .*10 de janeiro de 2030.*12:00/);
});

test("reabrir um cancelado manda de novo o e-mail de horario agendado", () => {
  const notification = mapDomainEventToNotification(
    updatedEvent({ status: "CONFIRMED", previousStatus: "CANCELED" }),
  );

  assert.equal(notification?.subject, "Seu horário está agendado: Limpeza de pele");
});

test("observacao, confirmacao, exclusao ou cancelamento passado ficam so no log", () => {
  const cases = [
    updatedEvent({}),
    updatedEvent({ status: "CONFIRMED" }),
    updatedEvent({ status: "CANCELED", scheduledAt: "2020-01-01T12:00:00.000Z", previousScheduledAt: "2020-01-01T12:00:00.000Z" }),
    updatedEvent({ previousStatus: undefined, previousScheduledAt: undefined, status: "CANCELED" }),
    { ...baseEvent, type: "appointment.deleted" },
  ];

  for (const event of cases) {
    const notification = mapDomainEventToNotification(event);
    assert.equal(notification?.channel, "log", JSON.stringify(event.metadata));
    assert.equal(notification?.recipient, "clinic:clinic-1");
  }
});

test("agendamento sem e-mail do cliente ou ja concluido continua so no log", () => {
  const metadata = {
    clientName: "Maria",
    serviceName: "Limpeza de pele",
    scheduledAt: "2026-11-10T12:00:00.000Z",
    status: "SCHEDULED",
  };

  for (const extra of [{ clientEmail: null }, { clientEmail: "maria@example.com", status: "COMPLETED" }]) {
    const notification = mapDomainEventToNotification({
      ...baseEvent,
      type: "appointment.created",
      metadata: { ...metadata, ...extra },
    });
    assert.equal(notification?.channel, "log");
    assert.equal(notification?.recipient, "clinic:clinic-1");
    assert.equal(notification?.html, undefined);
  }
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
