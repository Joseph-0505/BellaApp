import { randomUUID } from "node:crypto";
import { z } from "zod";
import { env } from "../../config/env";
import { connectRedis, redis } from "../../lib/redis";

export const domainEventTypes = [
  "appointment.completed",
  "appointment.created",
  "appointment.deleted",
  "appointment.updated",
  "billing.paid",
  "client.created",
  "client.deleted",
  "client.updated",
  "professional.created",
  "professional.deleted",
  "professional.updated",
  "service.created",
  "service.deleted",
  "service.updated",
] as const;

export type DomainEventType = (typeof domainEventTypes)[number];

const domainEventSchema = z.object({
  eventId: z.string().uuid(),
  type: z.enum(domainEventTypes),
  clinicId: z.string().min(1),
  aggregateId: z.string().min(1),
  actorId: z.string().min(1),
  occurredAt: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
});

export type DomainEvent = z.infer<typeof domainEventSchema>;

export type PublishDomainEventInput = {
  type: DomainEventType;
  clinicId: string;
  aggregateId: string;
  actorId: string;
  metadata?: Record<string, unknown>;
};

type EventLogger = {
  error(payload: object, message?: string): void;
  info(payload: object, message?: string): void;
  warn(payload: object, message?: string): void;
};

type PublisherClient = {
  publish(channel: string, message: string): Promise<number>;
};

type SubscriberClient = {
  close(): Promise<unknown>;
  connect(): Promise<unknown>;
  on(event: "error", listener: (error: Error) => void): unknown;
  subscribe(
    channel: string,
    listener: (message: string, channel: string) => void,
  ): Promise<unknown>;
};

type DomainEventHandler = (event: DomainEvent) => Promise<void> | void;

type DomainEventBusOptions = {
  channel: string;
  enabled: boolean;
  ensurePublisherConnection: () => Promise<void>;
};

export class DomainEventBus {
  private readonly handlers = new Set<DomainEventHandler>();
  private logger: EventLogger | undefined;
  private subscriber: SubscriberClient | null = null;

  constructor(
    private readonly publisher: PublisherClient,
    private readonly createSubscriber: () => SubscriberClient,
    private readonly options: DomainEventBusOptions,
  ) {}

  setLogger(logger: EventLogger): void {
    this.logger = logger;
  }

  onEvent(handler: DomainEventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  async publish(input: PublishDomainEventInput): Promise<DomainEvent> {
    const event: DomainEvent = {
      eventId: randomUUID(),
      type: input.type,
      clinicId: input.clinicId,
      aggregateId: input.aggregateId,
      actorId: input.actorId,
      occurredAt: new Date().toISOString(),
      ...(input.metadata ? { metadata: input.metadata } : {}),
    };

    if (!this.options.enabled) {
      return event;
    }

    try {
      await this.options.ensurePublisherConnection();
      const subscribers = await this.publisher.publish(
        this.options.channel,
        JSON.stringify(event),
      );
      this.logger?.info(
        {
          event: "domain_event.published",
          domainEventId: event.eventId,
          domainEventType: event.type,
          clinicId: event.clinicId,
          aggregateId: event.aggregateId,
          subscribers,
        },
        "Domain event published",
      );
    } catch (error) {
      this.logger?.warn(
        {
          err: error,
          event: "domain_event.publish_failed",
          domainEventId: event.eventId,
          domainEventType: event.type,
        },
        "Domain event could not be published",
      );
    }

    return event;
  }

  async start(): Promise<void> {
    if (!this.options.enabled || this.subscriber) {
      return;
    }

    const subscriber = this.createSubscriber();
    subscriber.on("error", (error) => {
      this.logger?.error(
        { err: error, component: "redis-pubsub" },
        "Redis Pub/Sub subscriber error",
      );
    });
    await subscriber.connect();
    await subscriber.subscribe(this.options.channel, (message) => {
      void this.consume(message);
    });
    this.subscriber = subscriber;
    this.logger?.info(
      { channel: this.options.channel, event: "domain_event.subscribed" },
      "Domain event subscriber ready",
    );
  }

  async stop(): Promise<void> {
    const subscriber = this.subscriber;
    this.subscriber = null;

    if (subscriber) {
      await subscriber.close();
    }
  }

  private async consume(message: string): Promise<void> {
    try {
      const parsed = domainEventSchema.parse(JSON.parse(message));
      this.logger?.info(
        {
          event: "domain_event.received",
          domainEventId: parsed.eventId,
          domainEventType: parsed.type,
          clinicId: parsed.clinicId,
          aggregateId: parsed.aggregateId,
        },
        "Domain event received",
      );

      await Promise.all(
        [...this.handlers].map(async (handler) => handler(parsed)),
      );
      this.logger?.info(
        {
          event: "domain_event.processed",
          domainEventId: parsed.eventId,
          domainEventType: parsed.type,
        },
        "Domain event processed",
      );
    } catch (error) {
      this.logger?.warn(
        { err: error, event: "domain_event.invalid_message" },
        "Invalid domain event ignored",
      );
    }
  }
}

export const domainEventBus = new DomainEventBus(
  redis as unknown as PublisherClient,
  () => redis.duplicate() as unknown as SubscriberClient,
  {
    channel: env.PUBSUB_CHANNEL,
    enabled: env.REDIS_ENABLED && env.PUBSUB_ENABLED,
    ensurePublisherConnection: connectRedis,
  },
);
