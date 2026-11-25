import { env } from "../../config/env";

const NOTIFICATION_TIMEOUT_MS = 5_000;

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

  // O notification-service é o único que fala com o SMTP; o 202 dele significa "na fila, com retry".
  async sendProfessionalInvite(input: ProfessionalInviteEmailInput): Promise<void> {
    const response = await fetch(new URL("/api/v1/notifications", env.NOTIFICATION_SERVICE_URL), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        channel: "email",
        recipient: input.recipientEmail,
        subject: "Voce foi convidado para acessar a BellaApp",
        message: this.buildText(input),
        html: this.buildHtml(input),
        metadata: { source: "professional-invite" },
      }),
      signal: AbortSignal.timeout(NOTIFICATION_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`notification-service recusou o convite: HTTP ${response.status}`);
    }
  }
}

export const inviteEmailService = new InviteEmailService();
