import nodemailer, { Transporter } from "nodemailer";
import { env } from "../../config/env";

export type ProfessionalInviteEmailInput = {
  activationUrl: string;
  clinicName: string;
  recipientEmail: string;
  recipientName: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

class InviteEmailService {
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    this.transporter =
      env.MAIL_DELIVERY_MODE === "smtp"
        ? nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: env.SMTP_SECURE,
            auth:
              env.SMTP_USER && env.SMTP_PASS
                ? {
                    user: env.SMTP_USER,
                    pass: env.SMTP_PASS,
                  }
                : undefined,
          })
        : nodemailer.createTransport({
            jsonTransport: true,
          });

    return this.transporter;
  }

  private buildHtml(input: ProfessionalInviteEmailInput): string {
    const recipientName = escapeHtml(input.recipientName);
    const clinicName = escapeHtml(input.clinicName);
    const activationUrl = escapeHtml(input.activationUrl);

    return `
      <div style="font-family: Arial, sans-serif; color: #25324a; line-height: 1.6;">
        <h2 style="margin-bottom: 12px;">Voce foi convidado para acessar a BellaApp</h2>
        <p>Ola, ${recipientName}.</p>
        <p>${clinicName} convidou voce para acessar a agenda da clinica na BellaApp.</p>
        <p style="margin: 24px 0;">
          <a
            href="${activationUrl}"
            style="display: inline-block; padding: 12px 20px; border-radius: 12px; background: #d97ea4; color: #ffffff; text-decoration: none; font-weight: 700;"
          >
            Criar senha
          </a>
        </p>
        <p>Se o botao nao abrir, copie este link no navegador:</p>
        <p style="word-break: break-all;">${activationUrl}</p>
        <p>Esse convite expira em ${env.INVITE_TOKEN_EXPIRES_HOURS} horas.</p>
      </div>
    `;
  }

  private buildText(input: ProfessionalInviteEmailInput): string {
    return [
      "Voce foi convidado para acessar a BellaApp",
      "",
      `Ola, ${input.recipientName}.`,
      `${input.clinicName} convidou voce para acessar a agenda da clinica na BellaApp.`,
      "",
      `Crie sua senha em: ${input.activationUrl}`,
      `Esse convite expira em ${env.INVITE_TOKEN_EXPIRES_HOURS} horas.`,
    ].join("\n");
  }

  async sendProfessionalInvite(input: ProfessionalInviteEmailInput): Promise<void> {
    const transporter = this.getTransporter();

    const info = await transporter.sendMail({
      from: `"${env.MAIL_FROM_NAME}" <${env.MAIL_FROM_EMAIL || "no-reply@bellaapp.local"}>`,
      to: input.recipientEmail,
      subject: "Voce foi convidado para acessar a BellaApp",
      html: this.buildHtml(input),
      text: this.buildText(input),
    });

    if (env.MAIL_DELIVERY_MODE === "log") {
      console.info("[invite-email]", typeof info.message === "string" ? info.message : JSON.stringify(info.message));
    }
  }
}

export const inviteEmailService = new InviteEmailService();
