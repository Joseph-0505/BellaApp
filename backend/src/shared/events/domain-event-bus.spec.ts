import { DomainEventBus } from "./domain-event-bus";

class FakePublisher {
  published: Array<{ channel: string; message: string }> = [];

  async publish(channel: string, message: string): Promise<number> {
    this.published.push({ channel, message });
    return 1;
  }
}

class FakeSubscriber {
  listener: ((message: string, channel: string) => void) | null = null;

  async connect(): Promise<void> {}
  async close(): Promise<void> {}
  on(): void {}

  async subscribe(
    _channel: string,
    listener: (message: string, channel: string) => void,
  ): Promise<void> {
    this.listener = listener;
  }

  emit(message: string): void {
    this.listener?.(message, "bellaapp:test-events");
  }
}

describe("DomainEventBus", () => {
  it("publica evento com envelope rastreavel e sem dados pessoais", async () => {
    const publisher = new FakePublisher();
    const subscriber = new FakeSubscriber();
    const bus = new DomainEventBus(publisher, () => subscriber, {
      channel: "bellaapp:test-events",
      enabled: true,
      ensurePublisherConnection: async () => undefined,
    });

    const event = await bus.publish({
      type: "appointment.created",
      clinicId: "clinic-1",
      aggregateId: "appointment-1",
      actorId: "user-1",
      metadata: {
        clientId: "client-1",
        professionalId: "professional-1",
        scheduledAt: "2026-11-10T12:00:00.000Z",
        serviceId: "service-1",
      },
    });

    expect(event.eventId).toMatch(/^[0-9a-f-]{36}$/);
    expect(publisher.published).toHaveLength(1);
    expect(JSON.parse(publisher.published[0]?.message ?? "{}")).toMatchObject({
      type: "appointment.created",
      clinicId: "clinic-1",
      aggregateId: "appointment-1",
      actorId: "user-1",
      metadata: {
        clientId: "client-1",
        professionalId: "professional-1",
        scheduledAt: "2026-11-10T12:00:00.000Z",
        serviceId: "service-1",
      },
    });
  });

  it("mantem a operacao principal quando a publicacao falha", async () => {
    const publisher = new FakePublisher();
    publisher.publish = jest.fn().mockRejectedValue(new Error("redis unavailable"));
    const logger = {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };
    const bus = new DomainEventBus(publisher, () => new FakeSubscriber(), {
      channel: "bellaapp:test-events",
      enabled: true,
      ensurePublisherConnection: async () => undefined,
    });
    bus.setLogger(logger);

    await expect(bus.publish({
      type: "appointment.created",
      clinicId: "clinic-1",
      aggregateId: "appointment-1",
      actorId: "user-1",
    })).resolves.toMatchObject({
      type: "appointment.created",
      aggregateId: "appointment-1",
    });

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "domain_event.publish_failed",
        domainEventType: "appointment.created",
      }),
      "Domain event could not be published",
    );
  });

  it("assina, valida e entrega mensagens aos consumidores", async () => {
    const publisher = new FakePublisher();
    const subscriber = new FakeSubscriber();
    const bus = new DomainEventBus(publisher, () => subscriber, {
      channel: "bellaapp:test-events",
      enabled: true,
      ensurePublisherConnection: async () => undefined,
    });
    const handler = jest.fn();
    bus.onEvent(handler);
    await bus.start();

    const event = await bus.publish({
      type: "appointment.updated",
      clinicId: "clinic-1",
      aggregateId: "appointment-1",
      actorId: "user-1",
    });
    subscriber.emit(JSON.stringify(event));
    await new Promise((resolve) => setImmediate(resolve));

    expect(handler).toHaveBeenCalledWith(event);
    await bus.stop();
  });
});
