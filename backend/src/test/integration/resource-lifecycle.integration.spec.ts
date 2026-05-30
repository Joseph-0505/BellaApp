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

describe("resource lifecycle integration", () => {
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

  it("deve atualizar e remover clientes, serviços e profissionais existentes", async () => {
    const authenticated = await createAuthenticatedUser(app);
    const headers = {
      authorization: `Bearer ${authenticated.token}`,
    };

    const onboardingResponse = await completeOnboardingAsTeam(app, authenticated.token);

    expect(onboardingResponse.statusCode).toBe(200);
    await upgradeClinicToTeam(authenticated.userId);

    const clientResponse = await app.inject({
      method: "POST",
      url: "/api/v1/clients",
      headers,
      payload: {
        name: "Cliente Base",
        phone: "(11) 99999-0001",
        email: "cliente@bella.com",
        cpf: "11144477735",
      },
    });

    const serviceResponse = await app.inject({
      method: "POST",
      url: "/api/v1/services",
      headers,
      payload: {
        name: "Laser Base",
        description: "Tratamento inicial",
        price: 250,
        durationMinutes: 60,
        active: true,
        risk: "medio",
        icon: "wand",
      },
    });

    const professionalResponse = await app.inject({
      method: "POST",
      url: "/api/v1/professionals",
      headers,
      payload: {
        name: "Dra. Ana",
        specialty: "Esteticista",
        phone: "(11) 99999-0002",
        email: "ana@bella.com",
        status: "ativo",
      },
    });

    const clientBody = parseJson<{ data: { id: string } }>(clientResponse.body);
    const serviceBody = parseJson<{ data: { id: string } }>(
      serviceResponse.body,
    );
    const professionalBody = parseJson<{ data: { id: string } }>(
      professionalResponse.body,
    );

    const updatedClientResponse = await app.inject({
      method: "PUT",
      url: `/api/v1/clients/${clientBody.data.id}`,
      headers,
      payload: {
        name: "Cliente Premium",
        phone: "(11) 99999-9999",
        email: "cliente.premium@bella.com",
        cpf: "11144477735",
        notes: "Retorno em 30 dias",
      },
    });

    const updatedServiceResponse = await app.inject({
      method: "PUT",
      url: `/api/v1/services/${serviceBody.data.id}`,
      headers,
      payload: {
        name: "Laser Premium",
        description: "Pacote completo",
        price: 320,
        durationMinutes: 90,
        active: false,
        risk: "alto",
        icon: "spark",
      },
    });

    const updatedProfessionalResponse = await app.inject({
      method: "PUT",
      url: `/api/v1/professionals/${professionalBody.data.id}`,
      headers,
      payload: {
        name: "Dra. Ana Clara",
        specialty: "Esteticista Senior",
        phone: "(11) 99999-1234",
        email: "ana.clara@bella.com",
        status: "inativo",
      },
    });

    const updatedClientBody = parseJson<{
      data: { name: string; email: string | null; notes: string | null };
    }>(updatedClientResponse.body);
    const updatedServiceBody = parseJson<{
      data: {
        name: string;
        price: number;
        durationMinutes: number;
        active: boolean;
        risk: string;
        icon: string;
      };
    }>(updatedServiceResponse.body);
    const updatedProfessionalBody = parseJson<{
      data: {
        name: string;
        specialty: string;
        email: string | null;
        status: string;
      };
    }>(updatedProfessionalResponse.body);

    expect(updatedClientResponse.statusCode).toBe(200);
    expect(updatedClientBody.data).toMatchObject({
      name: "Cliente Premium",
      email: "cliente.premium@bella.com",
      notes: "Retorno em 30 dias",
    });

    expect(updatedServiceResponse.statusCode).toBe(200);
    expect(updatedServiceBody.data).toMatchObject({
      name: "Laser Premium",
      price: 320,
      durationMinutes: 90,
      active: false,
      risk: "alto",
      icon: "spark",
    });

    expect(updatedProfessionalResponse.statusCode).toBe(200);
    expect(updatedProfessionalBody.data).toMatchObject({
      name: "Dra. Ana Clara",
      specialty: "Esteticista Senior",
      email: "ana.clara@bella.com",
      status: "inativo",
    });

    const deleteProfessionalResponse = await app.inject({
      method: "DELETE",
      url: `/api/v1/professionals/${professionalBody.data.id}`,
      headers,
    });
    const deleteServiceResponse = await app.inject({
      method: "DELETE",
      url: `/api/v1/services/${serviceBody.data.id}`,
      headers,
    });
    const deleteClientResponse = await app.inject({
      method: "DELETE",
      url: `/api/v1/clients/${clientBody.data.id}`,
      headers,
    });

    expect(deleteProfessionalResponse.statusCode).toBe(204);
    expect(deleteServiceResponse.statusCode).toBe(204);
    expect(deleteClientResponse.statusCode).toBe(204);

    const deletedClientGet = await app.inject({
      method: "GET",
      url: `/api/v1/clients/${clientBody.data.id}`,
      headers,
    });
    const deletedServiceGet = await app.inject({
      method: "GET",
      url: `/api/v1/services/${serviceBody.data.id}`,
      headers,
    });
    const deletedProfessionalGet = await app.inject({
      method: "GET",
      url: `/api/v1/professionals/${professionalBody.data.id}`,
      headers,
    });

    expect(
      parseJson<{ error: { code: string } }>(deletedClientGet.body).error.code,
    ).toBe("RESOURCE_NOT_FOUND");
    expect(deletedClientGet.statusCode).toBe(404);
    expect(
      parseJson<{ error: { code: string } }>(deletedServiceGet.body).error.code,
    ).toBe("RESOURCE_NOT_FOUND");
    expect(deletedServiceGet.statusCode).toBe(404);
    expect(
      parseJson<{ error: { code: string } }>(deletedProfessionalGet.body).error
        .code,
    ).toBe("RESOURCE_NOT_FOUND");
    expect(deletedProfessionalGet.statusCode).toBe(404);
  });

  it("deve listar, buscar, atualizar e remover agendamentos relacionados a cliente, serviço e profissional", async () => {
    const authenticated = await createAuthenticatedUser(app);
    const headers = {
      authorization: `Bearer ${authenticated.token}`,
    };

    const onboardingResponse = await completeOnboardingAsTeam(app, authenticated.token);

    expect(onboardingResponse.statusCode).toBe(200);
    await upgradeClinicToTeam(authenticated.userId);

    const clientResponse = await app.inject({
      method: "POST",
      url: "/api/v1/clients",
      headers,
      payload: {
        name: "Cliente Agenda",
        phone: "(11) 98888-9999",
      },
    });

    const serviceResponse = await app.inject({
      method: "POST",
      url: "/api/v1/services",
      headers,
      payload: {
        name: "Peeling",
        price: 180,
        durationMinutes: 60,
        active: true,
      },
    });

    const professionalResponse = await app.inject({
      method: "POST",
      url: "/api/v1/professionals",
      headers,
      payload: {
        name: "Dra. Bia",
        specialty: "Esteticista",
        phone: "(11) 97777-8888",
        status: "ativo",
      },
    });

    const roomResponse = await app.inject({
      method: "POST",
      url: "/api/v1/rooms",
      headers,
      payload: {
        name: "Sala Agenda",
        color: "#E8D8E2",
        active: true,
      },
    });

    const clientBody = parseJson<{ data: { id: string } }>(clientResponse.body);
    const serviceBody = parseJson<{ data: { id: string } }>(
      serviceResponse.body,
    );
    const professionalBody = parseJson<{ data: { id: string } }>(
      professionalResponse.body,
    );
    const roomBody = parseJson<{ data: { id: string } }>(roomResponse.body);
    const scheduledAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    scheduledAt.setUTCMinutes(0, 0, 0);

    const appointmentResponse = await app.inject({
      method: "POST",
      url: "/api/v1/appointments",
      headers,
      payload: {
        clientId: clientBody.data.id,
        serviceId: serviceBody.data.id,
        professionalId: professionalBody.data.id,
        roomId: roomBody.data.id,
        scheduledAt: scheduledAt.toISOString(),
        status: "SCHEDULED",
        notes: "Primeira sessão",
      },
    });

    const appointmentBody = parseJson<{
      data: {
        id: string;
        clientId: string;
        serviceId: string;
        professionalId: string | null;
        status: string;
      };
    }>(appointmentResponse.body);

    expect(appointmentResponse.statusCode).toBe(201);
    expect(appointmentBody.data).toMatchObject({
      clientId: clientBody.data.id,
      serviceId: serviceBody.data.id,
      professionalId: professionalBody.data.id,
      status: "SCHEDULED",
    });

    const roomGetResponse = await app.inject({
      method: "GET",
      url: `/api/v1/rooms/${roomBody.data.id}`,
      headers,
    });

    const roomGetBody = parseJson<{
      data: { id: string; monthlyAppointments: number };
    }>(roomGetResponse.body);

    expect(roomGetResponse.statusCode).toBe(200);
    expect(roomGetBody.data).toMatchObject({
      id: roomBody.data.id,
      monthlyAppointments: 1,
    });

    const listResponse = await app.inject({
      method: "GET",
      url:
        `/api/v1/appointments?page=1&limit=10&status=SCHEDULED&date=${scheduledAt.toISOString().slice(0, 10)}` +
        `&clientId=${clientBody.data.id}&serviceId=${serviceBody.data.id}&professionalId=${professionalBody.data.id}`,
      headers,
    });

    const listBody = parseJson<{
      data: Array<{ id: string; status: string }>;
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>(listResponse.body);

    expect(listResponse.statusCode).toBe(200);
    expect(listBody.meta).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
    expect(listBody.data).toEqual([
      expect.objectContaining({
        id: appointmentBody.data.id,
        status: "SCHEDULED",
      }),
    ]);

    const getResponse = await app.inject({
      method: "GET",
      url: `/api/v1/appointments/${appointmentBody.data.id}`,
      headers,
    });

    const getBody = parseJson<{ data: { id: string; notes: string | null } }>(
      getResponse.body,
    );

    expect(getResponse.statusCode).toBe(200);
    expect(getBody.data).toMatchObject({
      id: appointmentBody.data.id,
      notes: "Primeira sessão",
    });

    const updateResponse = await app.inject({
      method: "PUT",
      url: `/api/v1/appointments/${appointmentBody.data.id}`,
      headers,
      payload: {
        clientId: clientBody.data.id,
        serviceId: serviceBody.data.id,
        professionalId: professionalBody.data.id,
        scheduledAt: scheduledAt.toISOString(),
        status: "CONFIRMED",
        notes: "Paciente confirmada",
      },
    });

    const updateBody = parseJson<{
      data: { status: string; notes: string | null };
    }>(updateResponse.body);

    expect(updateResponse.statusCode).toBe(200);
    expect(updateBody.data).toMatchObject({
      status: "CONFIRMED",
      notes: "Paciente confirmada",
    });

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/api/v1/appointments/${appointmentBody.data.id}`,
      headers,
    });

    expect(deleteResponse.statusCode).toBe(204);

    const deletedGetResponse = await app.inject({
      method: "GET",
      url: `/api/v1/appointments/${appointmentBody.data.id}`,
      headers,
    });

    const deletedGetBody = parseJson<{ error: { code: string } }>(
      deletedGetResponse.body,
    );

    expect(deletedGetResponse.statusCode).toBe(404);
    expect(deletedGetBody.error.code).toBe("RESOURCE_NOT_FOUND");
  });
});
