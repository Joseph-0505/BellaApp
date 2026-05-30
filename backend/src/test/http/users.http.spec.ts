jest.mock("../../modules/users/users.service", () => ({
  usersService: {
    getCurrentUser: jest.fn(),
    updateCurrentUser: jest.fn(),
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
import { buildApp } from "../../app/app";
import { buildAuthHeaders, parseJson } from "../helpers/http";
import { usersService } from "../../modules/users/users.service";

const mockedUsersService = usersService as jest.Mocked<typeof usersService>;

describe("users routes", () => {
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

  it("deve bloquear acesso sem token em GET /users/me", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/users/me",
    });

    const body = parseJson<{ error: { code: string; message: string } }>(response.body);

    expect(response.statusCode).toBe(401);
    expect(body.error.code).toBe("INVALID_TOKEN");
    expect(mockedUsersService.getCurrentUser).not.toHaveBeenCalled();
  });

  it("deve retornar usuário autenticado em GET /users/me", async () => {
    mockedUsersService.getCurrentUser.mockResolvedValue({
      id: "user-1",
      name: "Maria Silva",
      email: "maria@bella.com",
      cpf: "12345678909",
      businessProfile: null,
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/users/me",
      headers: buildAuthHeaders("user-1"),
    });

    const body = parseJson<{ data: { id: string; email: string } }>(response.body);

    expect(response.statusCode).toBe(200);
    expect(mockedUsersService.getCurrentUser).toHaveBeenCalledWith("user-1");
    expect(body.data).toMatchObject({
      id: "user-1",
      email: "maria@bella.com",
    });
  });

  it("deve rejeitar tentativa de enviar email no update de usuário", async () => {
    const response = await app.inject({
      method: "PUT",
      url: "/api/v1/users/me",
      headers: buildAuthHeaders("user-1"),
      payload: {
        name: "Maria Silva",
        email: "novo@bella.com",
        cpf: "123.456.789-09",
        password: "Senha@123",
      },
    });

    const body = parseJson<{
      error: { code: string; message: string; details?: Array<{ path: string; message: string }> };
    }>(response.body);

    expect(response.statusCode).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(mockedUsersService.updateCurrentUser).not.toHaveBeenCalled();
  });

  it("deve rejeitar update sem os campos obrigatórios", async () => {
    const response = await app.inject({
      method: "PUT",
      url: "/api/v1/users/me",
      headers: buildAuthHeaders("user-1"),
      payload: {},
    });

    const body = parseJson<{
      error: { code: string; details?: Array<{ path: string; message: string }> };
    }>(response.body);

    expect(response.statusCode).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "name" }),
        expect.objectContaining({ path: "cpf" }),
        expect.objectContaining({ path: "password" }),
      ]),
    );
    expect(mockedUsersService.updateCurrentUser).not.toHaveBeenCalled();
  });

  it("deve rejeitar update com CPF inválido", async () => {
    const response = await app.inject({
      method: "PUT",
      url: "/api/v1/users/me",
      headers: buildAuthHeaders("user-1"),
      payload: {
        name: "Maria Silva",
        cpf: "111.111.111-11",
        password: "Senha@123",
      },
    });

    const body = parseJson<{
      error: { code: string; details?: Array<{ path: string; message: string }> };
    }>(response.body);

    expect(response.statusCode).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: "cpf" })]),
    );
    expect(mockedUsersService.updateCurrentUser).not.toHaveBeenCalled();
  });

  it("deve rejeitar update com senha fraca", async () => {
    const response = await app.inject({
      method: "PUT",
      url: "/api/v1/users/me",
      headers: buildAuthHeaders("user-1"),
      payload: {
        name: "Maria Silva",
        cpf: "123.456.789-09",
        password: "senha123",
      },
    });

    const body = parseJson<{
      error: { code: string; details?: Array<{ path: string; message: string }> };
    }>(response.body);

    expect(response.statusCode).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: "password" })]),
    );
    expect(mockedUsersService.updateCurrentUser).not.toHaveBeenCalled();
  });

  it("deve atualizar usuário autenticado com payload válido", async () => {
    mockedUsersService.updateCurrentUser.mockResolvedValue({
      id: "user-1",
      name: "Maria Atualizada",
      email: "maria@bella.com",
      cpf: "12345678909",
      businessProfile: {
        businessName: "Bella Clinic",
        cnpj: "11222333000181",
      },
    });

    const payload = {
      name: "Maria Atualizada",
      cpf: "123.456.789-09",
      password: "Senha@123",
      businessName: "Bella Clinic",
      cnpj: "11.222.333/0001-81",
    };

    const response = await app.inject({
      method: "PUT",
      url: "/api/v1/users/me",
      headers: buildAuthHeaders("user-1"),
      payload,
    });

    const body = parseJson<{ data: { name: string; businessProfile: { businessName: string } | null } }>(
      response.body,
    );

    expect(response.statusCode).toBe(200);
    expect(mockedUsersService.updateCurrentUser).toHaveBeenCalledWith("user-1", payload);
    expect(body.data.name).toBe("Maria Atualizada");
    expect(body.data.businessProfile).toMatchObject({
      businessName: "Bella Clinic",
    });
  });
});
