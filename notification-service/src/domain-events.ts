import { createClient } from "redis";
import { z } from "zod";
import { env } from "./config";
import { ServiceLogger } from "./logger";
import { NotificationInput } from "./notification";
import { NotificationQueue } from "./queue";

const supportedDomainEventTypes = [
  "appointment.created",
  "appointment.updated",
  "appointment.completed",
  "appointment.deleted",
  "billing.paid",
] as const;

const domainEventSchema = z.object({
  eventId: z.string().uuid(),
  type: z.string(),
  clinicId: z.string().min(1),
  aggregateId: z.string().min(1),
  actorId: z.string().min(1),
  occurredAt: z.string().datetime(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

type DomainEvent = z.infer<typeof domainEventSchema>;

const subjects: Record<(typeof supportedDomainEventTypes)[number], string> = {
  "appointment.created": "Novo agendamento",
  "appointment.updated": "Agendamento atualizado",
  "appointment.completed": "Agendamento concluido",
  "appointment.deleted": "Agendamento removido",
  "billing.paid": "Pagamento confirmado",
};

function isSupportedType(
  type: string,
): type is (typeof supportedDomainEventTypes)[number] {
  return supportedDomainEventTypes.includes(
    type as (typeof supportedDomainEventTypes)[number],
  );
}

export function mapDomainEventToNotification(
  event: DomainEvent,
): NotificationInput | null {
  if (!isSupportedType(event.type)) return null;

  return {
    channel: "log",
    recipient: `clinic:${event.clinicId}`,
    subject: subjects[event.type],
    message: `${subjects[event.type]} para o recurso ${event.aggregateId}.`,
    metadata: {
      ...event.metadata,
      source: "domain-event",
      domainEventId: event.eventId,
      domainEventType: event.type,
      clinicId: event.clinicId,
      aggregateId: event.aggregateId,
      occurredAt: event.occurredAt,
    },
  };
}

export class DomainEventBridge {
  private started = false;

  constructor(
    private readonly subscriber: Pick<
      ReturnType<typeof createClient>,
      "connect" | "subscribe" | "unsubscribe" | "close"
    >,
    private readonly queue: NotificationQueue,
    private readonly logger: ServiceLogger,
  ) {}

  async start(): Promise<void> {
    if (!env.DOMAIN_EVENTS_ENABLED || this.started) return;

    await this.subscriber.connect();
    await this.subscriber.subscribe(env.PUBSUB_CHANNEL, async (rawMessage) => {
      try {
        const event = domainEventSchema.parse(JSON.parse(rawMessage));
        const notification = mapDomainEventToNotification(event);
        if (!notification) return;

        const job = await this.queue.enqueue(notification);
        this.logger.info(
          {
            event: "notification.enqueued_from_domain_event",
            notificationId: job.id,
            domainEventId: event.eventId,
            domainEventType: event.type,
          },
          "Domain event converted to notification",
        );
      } catch (error) {
        this.logger.warn(
          { err: error, event: "notification.invalid_domain_event" },
          "Domain event ignored by notification service",
        );
      }
    });
    this.started = true;
    this.logger.info(
      { channel: env.PUBSUB_CHANNEL, event: "notification.domain_events_subscribed" },
      "Notification domain event bridge ready",
    );
  }

  async stop(): Promise<void> {
    if (!this.started) return;
    this.started = false;
    await this.subscriber.unsubscribe(env.PUBSUB_CHANNEL);
    await this.subscriber.close();
  }
}
