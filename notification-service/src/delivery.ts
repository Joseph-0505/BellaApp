import nodemailer, { Transporter } from "nodemailer";
import { env } from "./config";
import { ServiceLogger } from "./logger";
import { NotificationJob } from "./notification";

export class NotificationDelivery {
  private transporter: Transporter | null = null;

  constructor(private readonly logger: ServiceLogger) {}

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;

    this.transporter =
      env.MAIL_DELIVERY_MODE === "smtp"
        ? nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: env.SMTP_SECURE,
            auth:
              env.SMTP_USER && env.SMTP_PASS
                ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
                : undefined,
          })
        : nodemailer.createTransport({ jsonTransport: true });

    return this.transporter;
  }

  async send(job: NotificationJob): Promise<void> {
    if (job.channel === "log") {
      this.logger.info(
        {
          event: "notification.delivered",
          notificationId: job.id,
          channel: job.channel,
          recipient: job.recipient,
          subject: job.subject,
          metadata: job.metadata,
        },
        job.message,
      );
      return;
    }

    const info = await this.getTransporter().sendMail({
      from: `"${env.MAIL_FROM_NAME}" <${env.MAIL_FROM_EMAIL}>`,
      to: job.recipient,
      subject: job.subject,
      text: job.message,
    });

    this.logger.info(
      {
        event: "notification.delivered",
        notificationId: job.id,
        channel: job.channel,
        recipient: job.recipient,
        transport: env.MAIL_DELIVERY_MODE,
        messageId: info.messageId,
      },
      "Notification delivered",
    );
  }
}
