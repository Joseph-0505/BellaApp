import { createClient } from "redis";
import { z } from "zod";
import { env } from "./config";
import { ServiceLogger } from "./logger";
import { NotificationInput } from "./notification";
import { NotificationQueue } from "./queue";
import { REMINDER_LEAD_MS, ReminderScheduler } from "./reminders";

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

// Só agendamento novo e ainda em aberto, de cliente com e-mail, vira e-mail para o cliente.
const clientAppointmentEmailSchema = z.object({
  clientEmail: z.string().trim().email(),
  clientName: z.string().trim().min(1),
  serviceName: z.string().trim().min(1),
  professionalName: z.string().trim().min(1).nullish(),
  scheduledAt: z.string().datetime(),
  status: z.enum(["SCHEDULED", "CONFIRMED"]),
});

const scheduledAtFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "full",
  timeStyle: "short",
  // shortcut: fuso fixo de Brasília; se houver clínica em outro fuso, guardar o fuso na clínica e mandá-lo no evento.
  timeZone: "America/Sao_Paulo",
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type ClientAppointmentEmailData = z.infer<typeof clientAppointmentEmailSchema>;
type EmailCopy = { subject: string; heading: string; intro: string };

function renderClientAppointmentEmail(
  data: ClientAppointmentEmailData,
  copy: EmailCopy,
): Pick<NotificationInput, "channel" | "recipient" | "subject" | "message" | "html"> {
  const { clientEmail, clientName, serviceName, professionalName, scheduledAt } = data;
  const when = scheduledAtFormatter.format(new Date(scheduledAt));
  const details: Array<[string, string]> = [
    ["Serviço", serviceName],
    ["Quando", when],
    ...(professionalName ? [["Profissional", professionalName] as [string, string]] : []),
  ];

  const rows = details
    .map(
      ([label, value]) => `
          <tr>
            <td style="padding: 8px 0; color: #6b7690; width: 120px;">${label}</td>
            <td style="padding: 8px 0; font-weight: 700;">${escapeHtml(value)}</td>
          </tr>`,
    )
    .join("");

  return {
    channel: "email",
    recipient: clientEmail,
    subject: copy.subject,
    message: [
      `Olá, ${clientName}!`,
      "",
      copy.intro,
      "",
      ...details.map(([label, value]) => `${label}: ${value}`),
      "",
      "Se precisar remarcar ou cancelar, fale com a clínica.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #25324a; line-height: 1.6; max-width: 520px;">
        <h2 style="margin-bottom: 12px; color: #d97ea4;">${escapeHtml(copy.heading)}</h2>
        <p>Olá, ${escapeHtml(clientName)}!</p>
        <p>${escapeHtml(copy.intro)} Confira os detalhes do seu atendimento:</p>
        <table style="border-collapse: collapse; margin: 16px 0; width: 100%;">${rows}
        </table>
        <p>Se precisar remarcar ou cancelar, fale com a clínica.</p>
        <p style="color: #6b7690; font-size: 12px; margin-top: 24px;">Mensagem automática enviada pela BellaApp.</p>
      </div>
    `,
  };
}

function buildClientAppointmentEmail(event: DomainEvent) {
  if (event.type !== "appointment.created") return null;
  const parsed = clientAppointmentEmailSchema.safeParse(event.metadata);
  if (!parsed.success) return null;
  return renderClientAppointmentEmail(parsed.data, {
    subject: `Seu horário está agendado: ${parsed.data.serviceName}`,
    heading: "Seu horário está agendado",
    intro: "Seu horário foi agendado.",
  });
}

// KAN-76: lembrete 24h antes para agendamento em aberto de cliente com e-mail.
export function buildAppointmentReminder(
  event: DomainEvent,
  now = Date.now(),
): { dueAt: number; notification: NotificationInput } | null {
  if (event.type !== "appointment.created" && event.type !== "appointment.updated") return null;
  const parsed = clientAppointmentEmailSchema.safeParse(event.metadata);
  if (!parsed.success) return null;

  const dueAt = Date.parse(parsed.data.scheduledAt) - REMINDER_LEAD_MS;
  if (dueAt <= now) return null;

  return {
    dueAt,
    notification: {
      ...renderClientAppointmentEmail(parsed.data, {
        subject: `Lembrete: seu horário de ${parsed.data.serviceName} é amanhã`,
        heading: "Seu horário é amanhã",
        intro: "Passando para lembrar do seu horário.",
      }),
      metadata: {
        source: "reminder",
        domainEventId: event.eventId,
        clinicId: event.clinicId,
        aggregateId: event.aggregateId,
      },
    },
  };
}

// Criar ou atualizar (re)agenda o lembrete; cancelar, concluir, remover ou perder o e-mail o tira.
export async function syncAppointmentReminder(
  reminders: Pick<ReminderScheduler, "schedule" | "cancel">,
  event: DomainEvent,
  now = Date.now(),
): Promise<void> {
  if (!event.type.startsWith("appointment.")) return;
  const reminder = buildAppointmentReminder(event, now);
  if (reminder) {
    await reminders.schedule(event.aggregateId, reminder.notification, reminder.dueAt);
    return;
  }
  await reminders.cancel(event.aggregateId);
}

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
    ...buildClientAppointmentEmail(event),
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
    private readonly reminders?: Pick<ReminderScheduler, "schedule" | "cancel">,
  ) {}

  async start(): Promise<void> {
    if (!env.DOMAIN_EVENTS_ENABLED || this.started) return;

    await this.subscriber.connect();
    await this.subscriber.subscribe(env.PUBSUB_CHANNEL, async (rawMessage) => {
      try {
        const event = domainEventSchema.parse(JSON.parse(rawMessage));
        if (this.reminders) await syncAppointmentReminder(this.reminders, event);
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
