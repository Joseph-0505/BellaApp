import { FastifyInstance } from "fastify";
import { buildApp } from "../../app/app";
import { prisma } from "../../lib/prisma";
import { createAuthenticatedUser } from "../helpers/auth-flow";
import { disconnectDatabase, resetDatabase } from "../helpers/database";
import { parseJson } from "../helpers/http";
import { completeOnboardingAsTeam } from "../helpers/onboarding-flow";

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

describe("crud integration", () => {
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

  it("deve criar clientes, paginar listagem e isolar acesso entre usuários", async () => {
    const owner = await createAuthenticatedUser(app);
    const outsider = await createAuthenticatedUser(app);

    const firstClientResponse = await app.inject({
      method: "POST",
      url: "/api/v1/clients",
      headers: {
        authorization: `Bearer ${owner.token}`,
      },
      payload: {
        name: "Cliente 1",
        phone: "(11) 99999-0001",
        email: "cliente1@bella.com",
        cpf: "11144477735",
      },
    });

    const secondClientResponse = await app.inject({
      method: "POST",
      url: "/api/v1/clients",
      headers: {
        authorization: `Bearer ${owner.token}`,
      },
      payload: {
        name: "Cliente 2",
        phone: "(11) 99999-0002",
        email: "cliente2@bella.com",
      },
    });

    expect(firstClientResponse.statusCode).toBe(201);
    expect(secondClientResponse.statusCode).toBe(201);

    const firstClientBody = parseJson<{ data: { id: string } }>(
      firstClientResponse.body,
    );

    const paginatedList = await app.inject({
      method: "GET",
      url: "/api/v1/clients?page=1&limit=1",
      headers: {
        authorization: `Bearer ${owner.token}`,
      },
    });

    const listBody = parseJson<{
      data: Array<{ id: string }>;
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>(paginatedList.body);

    expect(paginatedList.statusCode).toBe(200);
    expect(listBody.meta).toEqual({
      page: 1,
      limit: 1,
      total: 2,
      totalPages: 2,
    });
    expect(listBody.data).toHaveLength(1);

    const forbiddenClientAccess = await app.inject({
      method: "GET",
      url: `/api/v1/clients/${firstClientBody.data.id}`,
      headers: {
        authorization: `Bearer ${outsider.token}`,
      },
    });

    const forbiddenBody = parseJson<{ error: { code: string } }>(
      forbiddenClientAccess.body,
    );

    expect(forbiddenClientAccess.statusCode).toBe(404);
    expect(forbiddenBody.error.code).toBe("RESOURCE_NOT_FOUND");
  });

  it("deve validar service, criar recurso e retornar 404 ao buscar id inexistente", async () => {
    const authenticated = await createAuthenticatedUser(app);

    const invalidService = await app.inject({
      method: "POST",
      url: "/api/v1/services",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
      payload: {
        name: "Serviço inválido",
        price: -1,
        durationMinutes: 0,
        active: true,
      },
    });

    const invalidBody = parseJson<{ error: { code: string } }>(
      invalidService.body,
    );

    expect(invalidService.statusCode).toBe(400);
    expect(invalidBody.error.code).toBe("VALIDATION_ERROR");

    const createdService = await app.inject({
      method: "POST",
      url: "/api/v1/services",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
      payload: {
        name: "Laser",
        description: "Tratamento a laser",
        price: 250,
        durationMinutes: 60,
        active: true,
        risk: "alto",
        icon: "wand",
      },
    });

    const createdBody = parseJson<{
      data: { id: string; name: string; risk: string; soldCount: number };
    }>(createdService.body);

    expect(createdService.statusCode).toBe(201);
    expect(createdBody.data).toMatchObject({
      name: "Laser",
      risk: "alto",
      soldCount: 0,
    });

    const missingService = await app.inject({
      method: "GET",
      url: "/api/v1/services/4c7d1d0a-d708-4ce6-8d4e-930d7ef67a30",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
    });

    const missingBody = parseJson<{ error: { code: string } }>(
      missingService.body,
    );

    expect(missingService.statusCode).toBe(404);
    expect(missingBody.error.code).toBe("RESOURCE_NOT_FOUND");
  });

  it("deve criar profissionais, filtrar listagem e isolar acesso entre usuários", async () => {
    const owner = await createAuthenticatedUser(app);
    const outsider = await createAuthenticatedUser(app);

    const onboardingResponse = await completeOnboardingAsTeam(app, owner.token);

    expect(onboardingResponse.statusCode).toBe(200);
    await upgradeClinicToTeam(owner.userId);

    const firstProfessionalResponse = await app.inject({
      method: "POST",
      url: "/api/v1/professionals",
      headers: {
        authorization: `Bearer ${owner.token}`,
      },
      payload: {
        name: "Dra. Ana",
        specialty: "Fisioterapeuta",
        phone: "(11) 99999-1111",
        email: "ana@bella.com",
        status: "ativo",
      },
    });

    const secondProfessionalResponse = await app.inject({
      method: "POST",
      url: "/api/v1/professionals",
      headers: {
        authorization: `Bearer ${owner.token}`,
      },
      payload: {
        name: "Dra. Bia",
        specialty: "Esteticista",
        phone: "(11) 99999-2222",
        status: "inativo",
      },
    });

    expect(firstProfessionalResponse.statusCode).toBe(201);
    expect(secondProfessionalResponse.statusCode).toBe(201);

    const firstProfessionalBody = parseJson<{
      data: { id: string; status: string; specialty: string };
    }>(firstProfessionalResponse.body);

    const filteredList = await app.inject({
      method: "GET",
      url: "/api/v1/professionals?page=1&limit=10&status=ativo",
      headers: {
        authorization: `Bearer ${owner.token}`,
      },
    });

    const listBody = parseJson<{
      data: Array<{ id: string; status: string; specialty: string }>;
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>(filteredList.body);

    expect(filteredList.statusCode).toBe(200);
    expect(listBody.meta).toEqual({
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
    });
    expect(listBody.data).toHaveLength(2);
    expect(firstProfessionalBody.data.status).toBe("ativo");
    expect(firstProfessionalBody.data.specialty).toBe("Fisioterapeuta");
    expect(listBody.data[0]?.status).toBe("ativo");

    const forbiddenProfessionalAccess = await app.inject({
      method: "GET",
      url: `/api/v1/professionals/${firstProfessionalBody.data.id}`,
      headers: {
        authorization: `Bearer ${outsider.token}`,
      },
    });

    const forbiddenBody = parseJson<{ error: { code: string } }>(
      forbiddenProfessionalAccess.body,
    );

    expect(forbiddenProfessionalAccess.statusCode).toBe(404);
    expect(forbiddenBody.error.code).toBe("RESOURCE_NOT_FOUND");
  });

  it("deve criar agendamento válido e bloquear conflito ou data passada", async () => {
    const authenticated = await createAuthenticatedUser(app);

    const professionalsResponse = await app.inject({
      method: "GET",
      url: "/api/v1/professionals?page=1&limit=10&status=ativo",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
    });

    const professionalsBody = parseJson<{ data: Array<{ id: string }> }>(
      professionalsResponse.body,
    );
    const defaultProfessionalId = professionalsBody.data[0]?.id;

    expect(defaultProfessionalId).toBeTruthy();

    const clientResponse = await app.inject({
      method: "POST",
      url: "/api/v1/clients",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
      payload: {
        name: "Cliente Agenda",
        phone: "(11) 98888-9999",
      },
    });

    const serviceResponse = await app.inject({
      method: "POST",
      url: "/api/v1/services",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
      payload: {
        name: "Peeling",
        price: 180,
        durationMinutes: 60,
        active: true,
      },
    });

    const clientBody = parseJson<{ data: { id: string } }>(clientResponse.body);
    const serviceBody = parseJson<{ data: { id: string } }>(
      serviceResponse.body,
    );
    const scheduledAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    scheduledAt.setUTCMinutes(0, 0, 0);

    const appointmentResponse = await app.inject({
      method: "POST",
      url: "/api/v1/appointments",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
      payload: {
        clientId: clientBody.data.id,
        serviceId: serviceBody.data.id,
        professionalId: defaultProfessionalId,
        scheduledAt: scheduledAt.toISOString(),
        status: "SCHEDULED",
      },
    });

    const appointmentBody = parseJson<{ data: { id: string; status: string } }>(
      appointmentResponse.body,
    );

    expect(appointmentResponse.statusCode).toBe(201);
    expect(appointmentBody.data.status).toBe("SCHEDULED");

    const conflictResponse = await app.inject({
      method: "POST",
      url: "/api/v1/appointments",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
      payload: {
        clientId: clientBody.data.id,
        serviceId: serviceBody.data.id,
        professionalId: defaultProfessionalId,
        scheduledAt: new Date(
          scheduledAt.getTime() + 30 * 60 * 1000,
        ).toISOString(),
        status: "CONFIRMED",
      },
    });

    const conflictBody = parseJson<{ error: { code: string } }>(
      conflictResponse.body,
    );

    expect(conflictResponse.statusCode).toBe(409);
    expect(conflictBody.error.code).toBe("TIME_CONFLICT");

    const pastResponse = await app.inject({
      method: "POST",
      url: "/api/v1/appointments",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
      payload: {
        clientId: clientBody.data.id,
        serviceId: serviceBody.data.id,
        professionalId: defaultProfessionalId,
        scheduledAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        status: "SCHEDULED",
      },
    });

    const pastBody = parseJson<{ error: { code: string } }>(pastResponse.body);

    expect(pastResponse.statusCode).toBe(400);
    expect(pastBody.error.code).toBe("VALIDATION_ERROR");
  });
});
