jest.mock("../../modules/clients/clients.service", () => ({
  clientsService: {
    list: jest.fn(),
    create: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));

jest.mock("../../modules/services/services.service", () => ({
  servicesService: {
    list: jest.fn(),
    create: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));

jest.mock("../../modules/appointments/appointments.service", () => ({
  appointmentsService: {
    list: jest.fn(),
    create: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));

jest.mock("../../modules/professionals/professionals.service", () => ({
  professionalsService: {
    list: jest.fn(),
    create: jest.fn(),
    invite: jest.fn(),
    resendInvite: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));

jest.mock("../../shared/auth/authenticate", () => {
  const { AppError } = require("../../shared/errors/app-error");

  return {
    authenticate: jest.fn(async (request) => {
      const userId = request.headers["x-test-user-id"];

      if (typeof userId !== "string" || userId.trim().length === 0) {
        throw new AppError(401, "INVALID_TOKEN", "Token inválido ou expirado.");
      }

      request.user = {
        userId,
        sessionId: `session-${userId}`,
        type: "access",
      };
    }),
  };
});

import { FastifyInstance } from "fastify";
import { AppError } from "../../shared/errors/app-error";
import { buildApp } from "../../app/app";
import { appointmentsService } from "../../modules/appointments/appointments.service";
import { clientsService } from "../../modules/clients/clients.service";
import { professionalsService } from "../../modules/professionals/professionals.service";
import { servicesService } from "../../modules/services/services.service";
import { buildAuthHeaders, parseJson } from "../helpers/http";

const mockedClientsService = clientsService as jest.Mocked<typeof clientsService>;
const mockedServicesService = servicesService as jest.Mocked<typeof servicesService>;
const mockedAppointmentsService = appointmentsService as jest.Mocked<typeof appointmentsService>;
const mockedProfessionalsService = professionalsService as jest.Mocked<typeof professionalsService>;

describe("protected resource routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve exigir autenticação em GET /clients", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/clients",
    });

    const body = parseJson<{ error: { code: string } }>(response.body);

    expect(response.statusCode).toBe(401);
    expect(body.error.code).toBe("INVALID_TOKEN");
  });

  it("deve listar clientes com meta de paginação", async () => {
    mockedClientsService.list.mockResolvedValue({
      data: [
        {
          id: "client-1",
          name: "Fernanda",
          email: "fernanda@bella.com",
          phone: "(11) 99999-9999",
          cpf: "12345678909",
          notes: null,
          latestVisitAt: null,
          latestVisitNote: "Nenhum atendimento registrado",
          nextAppointmentAt: null,
          professional: null,
          totalSpent: 0,
          status: "novo",
        },
      ],
      meta: {
        page: 2,
        limit: 5,
        total: 11,
        totalPages: 3,
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/clients?page=2&limit=5&search=Fer",
      headers: buildAuthHeaders("user-42"),
    });

    const body = parseJson<{ data: Array<{ id: string }>; meta: { page: number; totalPages: number } }>(
      response.body,
    );

    expect(response.statusCode).toBe(200);
    expect(mockedClientsService.list).toHaveBeenCalledWith("user-42", {
      page: 2,
      limit: 5,
      search: "Fer",
    });
    expect(body.meta).toEqual({
      page: 2,
      limit: 5,
      total: 11,
      totalPages: 3,
    });
    expect(body.data[0]?.id).toBe("client-1");
  });

  it("deve validar email no cadastro de cliente", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/clients",
      headers: buildAuthHeaders("user-1"),
      payload: {
        name: "Fernanda",
        phone: "(11) 99999-9999",
        email: "email-invalido",
      },
    });

    const body = parseJson<{ error: { code: string } }>(response.body);

    expect(response.statusCode).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(mockedClientsService.create).not.toHaveBeenCalled();
  });

  it("deve retornar 204 ao remover cliente existente", async () => {
    mockedClientsService.remove.mockResolvedValue(undefined);

    const response = await app.inject({
      method: "DELETE",
      url: "/api/v1/clients/4c7d1d0a-d708-4ce6-8d4e-930d7ef67a30",
      headers: buildAuthHeaders("user-1"),
    });

    expect(response.statusCode).toBe(204);
    expect(mockedClientsService.remove).toHaveBeenCalledWith(
      "user-1",
      "4c7d1d0a-d708-4ce6-8d4e-930d7ef67a30",
    );
  });

  it("deve converter query de services para tipos corretos", async () => {
    mockedServicesService.list.mockResolvedValue({
      data: [],
      meta: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/services?page=1&limit=10&search=laser&active=true&risk=alto",
      headers: buildAuthHeaders("user-7"),
    });

    expect(response.statusCode).toBe(200);
    expect(mockedServicesService.list).toHaveBeenCalledWith("user-7", {
      page: 1,
      limit: 10,
      search: "laser",
      active: true,
      risk: "alto",
    });
  });

  it("deve validar preço negativo no cadastro de serviço", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/services",
      headers: buildAuthHeaders("user-1"),
      payload: {
        name: "Laser",
        price: -10,
        durationMinutes: 60,
        active: true,
      },
    });

    const body = parseJson<{ error: { code: string } }>(response.body);

    expect(response.statusCode).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(mockedServicesService.create).not.toHaveBeenCalled();
  });

  it("deve criar serviço com payload válido", async () => {
    mockedServicesService.create.mockResolvedValue({
      id: "service-1",
      name: "Laser",
      description: null,
      price: 250,
      durationMinutes: 60,
      active: true,
      risk: "alto",
      riskTone: "alto",
      riskLabel: "Alto",
      icon: "wand",
      soldCount: 0,
    });

    const payload = {
      name: "Laser",
      description: "Tratamento a laser",
      price: 250,
      durationMinutes: 60,
      active: true,
      risk: "alto",
      icon: "wand",
    };

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/services",
      headers: buildAuthHeaders("user-1"),
      payload,
    });

    const body = parseJson<{ data: { id: string; risk: string } }>(response.body);

    expect(response.statusCode).toBe(201);
    expect(mockedServicesService.create).toHaveBeenCalledWith("user-1", payload);
    expect(body.data).toMatchObject({
      id: "service-1",
      risk: "alto",
    });
  });

  it("deve converter query de professionals para tipos corretos", async () => {
    mockedProfessionalsService.list.mockResolvedValue({
      data: [],
      meta: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/professionals?page=1&limit=10&search=ana&status=ativo",
      headers: buildAuthHeaders("user-9"),
    });

    expect(response.statusCode).toBe(200);
    expect(mockedProfessionalsService.list).toHaveBeenCalledWith("user-9", {
      page: 1,
      limit: 10,
      search: "ana",
      status: "ativo",
    });
  });

  it("deve validar email no cadastro de profissional", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/professionals",
      headers: buildAuthHeaders("user-1"),
      payload: {
        name: "Dra. Ana",
        specialty: "Fisioterapeuta",
        phone: "(11) 99999-0001",
        email: "email-invalido",
        status: "ativo",
      },
    });

    const body = parseJson<{ error: { code: string } }>(response.body);

    expect(response.statusCode).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(mockedProfessionalsService.create).not.toHaveBeenCalled();
  });

  it("deve validar email no convite de profissional", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/professionals/invite",
      headers: buildAuthHeaders("user-1"),
      payload: {
        name: "Dra. Ana",
        email: "email-invalido",
      },
    });

    const body = parseJson<{ error: { code: string } }>(response.body);

    expect(response.statusCode).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(mockedProfessionalsService.invite).not.toHaveBeenCalled();
  });

  it("deve validar scheduledAt no cadastro de agendamento", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/appointments",
      headers: buildAuthHeaders("user-1"),
      payload: {
        clientId: "4c7d1d0a-d708-4ce6-8d4e-930d7ef67a30",
        serviceId: "a59feb31-4d72-45ef-8156-e5db1d7e90db",
        professionalId: "7c7d1d0a-d708-4ce6-8d4e-930d7ef67a30",
        scheduledAt: "24/03/2026 10:00",
        status: "SCHEDULED",
      },
    });

    const body = parseJson<{ error: { code: string } }>(response.body);

    expect(response.statusCode).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(mockedAppointmentsService.create).not.toHaveBeenCalled();
  });

  it("deve retornar 409 quando service acusar conflito de horário", async () => {
    mockedAppointmentsService.create.mockRejectedValue(
      new AppError(409, "TIME_CONFLICT", "Já existe um agendamento nesse horário."),
    );

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/appointments",
      headers: buildAuthHeaders("user-1"),
      payload: {
        clientId: "4c7d1d0a-d708-4ce6-8d4e-930d7ef67a30",
        serviceId: "a59feb31-4d72-45ef-8156-e5db1d7e90db",
        professionalId: "7c7d1d0a-d708-4ce6-8d4e-930d7ef67a30",
        scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        status: "SCHEDULED",
      },
    });

    const body = parseJson<{ error: { code: string; message: string } }>(response.body);

    expect(response.statusCode).toBe(409);
    expect(body.error).toEqual({
      code: "TIME_CONFLICT",
      message: "Já existe um agendamento nesse horário.",
    });
  });

  it("deve permitir remover agendamento com rota autenticada", async () => {
    mockedAppointmentsService.remove.mockResolvedValue(undefined);

    const response = await app.inject({
      method: "DELETE",
      url: "/api/v1/appointments/4c7d1d0a-d708-4ce6-8d4e-930d7ef67a30",
      headers: buildAuthHeaders("user-5"),
    });

    expect(response.statusCode).toBe(204);
    expect(mockedAppointmentsService.remove).toHaveBeenCalledWith(
      "user-5",
      "4c7d1d0a-d708-4ce6-8d4e-930d7ef67a30",
    );
  });

  it("deve permitir remover profissional com rota autenticada", async () => {
    mockedProfessionalsService.remove.mockResolvedValue(undefined);

    const response = await app.inject({
      method: "DELETE",
      url: "/api/v1/professionals/4c7d1d0a-d708-4ce6-8d4e-930d7ef67a30",
      headers: buildAuthHeaders("user-5"),
    });

    expect(response.statusCode).toBe(204);
    expect(mockedProfessionalsService.remove).toHaveBeenCalledWith(
      "user-5",
      "4c7d1d0a-d708-4ce6-8d4e-930d7ef67a30",
    );
  });
});
