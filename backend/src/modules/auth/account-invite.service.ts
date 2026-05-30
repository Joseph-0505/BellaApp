import { randomBytes } from "node:crypto";
import { env } from "../../config/env";
import { hashToken } from "../../shared/auth/jwt";
import { authRepository } from "./auth.repository";
import { inviteEmailService } from "./invite-email.service";

type IssueProfessionalInviteInput = {
  clinicName: string;
  recipientEmail: string;
  recipientName: string;
  userId: string;
};

function buildActivationUrl(token: string): string {
  const activationUrl = new URL("/ativar-conta", `${env.APP_BASE_URL}/`);
  activationUrl.searchParams.set("token", token);
  return activationUrl.toString();
}

class AccountInviteService {
  private buildExpirationDate(): Date {
    return new Date(Date.now() + env.INVITE_TOKEN_EXPIRES_HOURS * 60 * 60 * 1000);
  }

  private generateRawToken(): string {
    return randomBytes(32).toString("hex");
  }

  async issueProfessionalInvite(input: IssueProfessionalInviteInput): Promise<{ expiresAt: Date }> {
    const rawToken = this.generateRawToken();
    const expiresAt = this.buildExpirationDate();

    await authRepository.replaceInviteToken({
      userId: input.userId,
      tokenHash: hashToken(rawToken),
      expiresAt,
    });

    await inviteEmailService.sendProfessionalInvite({
      activationUrl: buildActivationUrl(rawToken),
      clinicName: input.clinicName,
      recipientEmail: input.recipientEmail,
      recipientName: input.recipientName,
    });

    return { expiresAt };
  }
}

export const accountInviteService = new AccountInviteService();
