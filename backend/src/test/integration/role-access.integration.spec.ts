import { FastifyInstance } from "fastify";

import { buildApp } from "../../app/app";
import { prisma } from "../../lib/prisma";
import { createAuthenticatedUser } from "../helpers/auth-flow";
import { disconnectDatabase, resetDatabase } from "../helpers/database";
import { parseJson } from "../helpers/http";
import { completeOnboardingAsTeam } from "../helpers/onboarding-flow";

describe("admin and professional access integration", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await app.close();
    await disconnectDatabase();
  });

  it("deve reservar gestão ao admin e respeitar as regras de exclusão por função", async () => {
    const admin = await createAuthenticatedUser(app);
    const professional = await createAuthenticatedUser(app);
    const onboardingResponse = await completeOnboardingAsTeam(app, admin.token);

    expect(onboardingResponse.statusCode).toBe(200);

    const adminMembership = await prisma.clinicUser.findFirstOrThrow({
      where: { userId: admin.userId },
      select: { clinicId: true },
    });
    const originalProfessionalMembership = await prisma.clinicUser.findFirstOrThrow({
      where: { userId: professional.userId },
      select: { clinicId: true },
    });

    await prisma.clinic.delete({
      where: { id: originalProfessionalMembership.clinicId },
    });

    const linkedProfessional = await prisma.professional.create({
      data: {
        clinicId: adminMembership.clinicId,
        userId: professional.userId,
        name: professional.credentials.name,
        email: professional.credentials.email,
        specialty: "Atendimento geral",
        phone: "A definir",
        status: true,
      },
    });

    await prisma.clinicUser.create({
      data: {
        clinicId: adminMembership.clinicId,
        userId: professional.userId,
        professionalId: linkedProfessional.id,
        role: "PROFESSIONAL",
      },
    });

    const adminServiceResponse = await app.inject({
      method: "POST",
      url: "/api/v1/services",
      headers: { authorization: `Bearer ${admin.token}` },
      payload: {
        name: "Limpeza de pele",
        price: 120,
        durationMinutes: 50,
        active: true,
      },
    });
    expect(adminServiceResponse.statusCode).toBe(201);

    const professionalServiceResponse = await app.inject({
      method: "POST",
      url: "/api/v1/services",
      headers: { authorization: `Bearer ${professional.token}` },
      payload: {
        name: "Serviço não autorizado",
        price: 80,
        durationMinutes: 30,
        active: true,
      },
    });
    const professionalServiceBody = parseJson<{ error: { code: string } }>(
      professionalServiceResponse.body,
    );

    expect(professionalServiceResponse.statusCode).toBe(403);
    expect(professionalServiceBody.error.code).toBe("FORBIDDEN");

    const professionalRoomResponse = await app.inject({
      method: "POST",
      url: "/api/v1/rooms",
      headers: { authorization: `Bearer ${professional.token}` },
      payload: {
        name: "Sala não autorizada",
        active: true,
      },
    });
    const professionalRoomBody = parseJson<{ error: { code: string } }>(
      professionalRoomResponse.body,
    );

    expect(professionalRoomResponse.statusCode).toBe(403);
    expect(professionalRoomBody.error.code).toBe("FORBIDDEN");

    const professionalListResponse = await app.inject({
      method: "GET",
      url: "/api/v1/services?page=1&limit=10",
      headers: { authorization: `Bearer ${professional.token}` },
    });
    expect(professionalListResponse.statusCode).toBe(200);

    const blockedAdminDeletion = await app.inject({
      method: "DELETE",
      url: "/api/v1/users/me",
      headers: { authorization: `Bearer ${admin.token}` },
      payload: {
        password: admin.credentials.password,
        confirmation: "EXCLUIR",
      },
    });
    const blockedAdminDeletionBody = parseJson<{ error: { code: string } }>(
      blockedAdminDeletion.body,
    );

    expect(blockedAdminDeletion.statusCode).toBe(409);
    expect(blockedAdminDeletionBody.error.code).toBe("ADMIN_TRANSFER_REQUIRED");

    const professionalDeletion = await app.inject({
      method: "DELETE",
      url: "/api/v1/users/me",
      headers: { authorization: `Bearer ${professional.token}` },
      payload: {
        password: professional.credentials.password,
        confirmation: "EXCLUIR",
      },
    });
    expect(professionalDeletion.statusCode).toBe(204);

    const adminDeletion = await app.inject({
      method: "DELETE",
      url: "/api/v1/users/me",
      headers: { authorization: `Bearer ${admin.token}` },
      payload: {
        password: admin.credentials.password,
        confirmation: "EXCLUIR",
      },
    });
    expect(adminDeletion.statusCode).toBe(204);

    expect(
      await prisma.user.findMany({
        where: { id: { in: [admin.userId, professional.userId] } },
      }),
    ).toHaveLength(0);
  });
});
