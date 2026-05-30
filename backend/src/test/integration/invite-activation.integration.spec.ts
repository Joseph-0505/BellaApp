const sentInviteEmails: Array<{ activationUrl: string; clinicName: string; recipientEmail: string }> = [];

jest.mock("../../modules/auth/invite-email.service", () => ({
  inviteEmailService: {
    sendProfessionalInvite: jest.fn(async (payload) => {
      sentInviteEmails.push(payload);
    }),
  },
}));

import { FastifyInstance } from "fastify";
import { buildApp } from "../../app/app";
import { prisma } from "../../lib/prisma";
import { createAuthenticatedUser } from "../helpers/auth-flow";
import { disconnectDatabase, resetDatabase } from "../helpers/database";
import { parseJson } from "../helpers/http";

async function upgradeClinicToTeam(userId: string): Promise<void> {
  const membership = await prisma.clinicUser.findFirstOrThrow({
    where: { userId },
    select: { clinicId: true },
  });

  await prisma.clinic.update({
    where: { id: membership.clinicId },
    data: { plan: "TEAM" },
  });
}

function extractTokenFromUrl(url: string): string {
  const parsedUrl = new URL(url);
  return parsedUrl.searchParams.get("token") || "";
}

describe("professional invite activation flow", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  beforeEach(async () => {
    sentInviteEmails.length = 0;
    await resetDatabase();
  });

  afterAll(async () => {
    await app.close();
    await disconnectDatabase();
  });

  it("deve convidar profissional, ativar conta e liberar login normal", async () => {
    const owner = await createAuthenticatedUser(app);
    await upgradeClinicToTeam(owner.userId);

    const inviteResponse = await app.inject({
      method: "POST",
      url: "/api/v1/professionals/invite",
      headers: {
        authorization: `Bearer ${owner.token}`,
      },
      payload: {
        name: "Ana Souza",
        email: "ana@bella.com",
      },
    });

    const inviteBody = parseJson<{ data: { id: string; accessStatus: string } }>(inviteResponse.body);

    expect(inviteResponse.statusCode).toBe(201);
    expect(inviteBody.data.accessStatus).toBe("invite_pending");
    expect(sentInviteEmails).toHaveLength(1);

    const firstInviteEmail = sentInviteEmails[0];
    expect(firstInviteEmail).toBeDefined();

    const token = extractTokenFromUrl(firstInviteEmail!.activationUrl);
    expect(token).toBeTruthy();

    const invitedUser = await prisma.user.findUnique({
      where: { email: "ana@bella.com" },
    });

    const invitedProfessional = await prisma.professional.findUnique({
      where: { id: inviteBody.data.id },
    });

    const invitedMembership = await prisma.clinicUser.findFirst({
      where: {
        professionalId: inviteBody.data.id,
      },
    });

    expect(invitedUser?.passwordHash).toBeNull();
    expect(invitedProfessional?.userId).toBe(invitedUser?.id);
    expect(invitedMembership?.role).toBe("PROFESSIONAL");
    expect(invitedUser?.id).toBeTruthy();

    const blockedLoginResponse = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        email: "ana@bella.com",
        password: "Senha@123",
      },
    });

    const blockedLoginBody = parseJson<{ error: { code: string } }>(blockedLoginResponse.body);

    expect(blockedLoginResponse.statusCode).toBe(403);
    expect(blockedLoginBody.error.code).toBe("ACCOUNT_NOT_ACTIVATED");

    const activationStatusResponse = await app.inject({
      method: "GET",
      url: `/api/v1/auth/activation?token=${token}`,
    });

    const activationStatusBody = parseJson<{
      data: { clinicName: string; email: string; name: string };
    }>(activationStatusResponse.body);

    expect(activationStatusResponse.statusCode).toBe(200);
    expect(activationStatusBody.data).toEqual({
      clinicName: "BellaApp",
      email: "ana@bella.com",
      name: "Ana Souza",
    });

    const activateResponse = await app.inject({
      method: "POST",
      url: "/api/v1/auth/activate",
      payload: {
        token,
        password: "Senha@123",
      },
    });

    const activateBody = parseJson<{ data: { email: string; name: string } }>(activateResponse.body);

    expect(activateResponse.statusCode).toBe(200);
    expect(activateBody.data).toEqual({
      email: "ana@bella.com",
      name: "Ana Souza",
    });

    const usedInvite = await prisma.inviteToken.findFirstOrThrow({
      where: {
        userId: invitedUser!.id,
      },
    });

    expect(usedInvite.usedAt).not.toBeNull();

    const loginResponse = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        email: "ana@bella.com",
        password: "Senha@123",
      },
    });

    const loginBody = parseJson<{ data: { token: string; user: { email: string } } }>(loginResponse.body);

    expect(loginResponse.statusCode).toBe(200);
    expect(loginBody.data.token).toBeTruthy();
    expect(loginBody.data.user.email).toBe("ana@bella.com");
  });

  it("deve reenviar convite com token novo e invalidar o anterior", async () => {
    const owner = await createAuthenticatedUser(app);
    await upgradeClinicToTeam(owner.userId);

    const inviteResponse = await app.inject({
      method: "POST",
      url: "/api/v1/professionals/invite",
      headers: {
        authorization: `Bearer ${owner.token}`,
      },
      payload: {
        name: "Bianca Lima",
        email: "bianca@bella.com",
      },
    });

    const inviteBody = parseJson<{ data: { id: string } }>(inviteResponse.body);
    const initialInviteEmail = sentInviteEmails[0];
    expect(initialInviteEmail).toBeDefined();

    const firstToken = extractTokenFromUrl(initialInviteEmail!.activationUrl);

    const resendResponse = await app.inject({
      method: "POST",
      url: `/api/v1/professionals/${inviteBody.data.id}/resend-invite`,
      headers: {
        authorization: `Bearer ${owner.token}`,
      },
    });

    expect(resendResponse.statusCode).toBe(200);
    expect(sentInviteEmails).toHaveLength(2);

    const resentInviteEmail = sentInviteEmails[1];
    expect(resentInviteEmail).toBeDefined();

    const secondToken = extractTokenFromUrl(resentInviteEmail!.activationUrl);

    expect(secondToken).toBeTruthy();
    expect(secondToken).not.toBe(firstToken);

    const oldTokenResponse = await app.inject({
      method: "GET",
      url: `/api/v1/auth/activation?token=${firstToken}`,
    });

    const oldTokenBody = parseJson<{ error: { code: string } }>(oldTokenResponse.body);

    expect(oldTokenResponse.statusCode).toBe(409);
    expect(oldTokenBody.error.code).toBe("INVITE_TOKEN_USED");

    const newTokenResponse = await app.inject({
      method: "GET",
      url: `/api/v1/auth/activation?token=${secondToken}`,
    });

    expect(newTokenResponse.statusCode).toBe(200);
  });
});
