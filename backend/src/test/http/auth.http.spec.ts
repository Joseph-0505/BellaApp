jest.mock("../../modules/auth/auth.service", () => ({
  authService: {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    refresh: jest.fn(),
    getActivationStatus: jest.fn(),
    activateAccount: jest.fn(),
  },
}));

import { FastifyInstance } from "fastify";
import { buildApp } from "../../app/app";
import { AppError } from "../../shared/errors/app-error";
import { parseJson } from "../helpers/http";
import { authService } from "../../modules/auth/auth.service";

const mockedAuthService = authService as jest.Mocked<typeof authService>;

function makeUserResponse() {
  return {
    id: "user-1",
    name: "Maria Silva",
    email: "maria@bella.com",
    cpf: "12345678909",
    businessProfile: null,
    clinic: null,
    membership: null,
    professional: null,
    permissions: {
      manageProfessionals: true,
      viewAllAgenda: true,
      viewAllCash: true,
    },
  };
}

describe("auth routes", () => {
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

  it("deve retornar 400 quando cadastro vier com email invalido", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        name: "Maria Silva",
        email: "email-invalido",
        password: "Senha@123",
        cpf: "123.456.789-09",
      },
    });

    const body = parseJson<{
      error: { code: string; message: string; details?: Array<{ path: string; message: string }> };
    }>(response.body);

    expect(response.statusCode).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "email",
        }),
      ]),
    );
    expect(mockedAuthService.register).not.toHaveBeenCalled();
  });

  it("deve retornar 400 quando cadastro vier sem os campos obrigatorios", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
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
        expect.objectContaining({ path: "email" }),
        expect.objectContaining({ path: "password" }),
        expect.objectContaining({ path: "cpf" }),
      ]),
    );
    expect(mockedAuthService.register).not.toHaveBeenCalled();
  });

  it("deve retornar 400 quando cadastro vier com CPF invalido", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        name: "Maria Silva",
        email: "maria@bella.com",
        password: "Senha@123",
        cpf: "111.111.111-11",
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
    expect(mockedAuthService.register).not.toHaveBeenCalled();
  });

  it("deve retornar 400 quando cadastro vier com senha fraca", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        name: "Maria Silva",
        email: "maria@bella.com",
        password: "senha123",
        cpf: "123.456.789-09",
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
    expect(mockedAuthService.register).not.toHaveBeenCalled();
  });

  it("deve retornar 201 no cadastro valido", async () => {
    mockedAuthService.register.mockResolvedValue(makeUserResponse());

    const payload = {
      name: "Maria Silva",
      email: "maria@bella.com",
      password: "Senha@123",
      cpf: "123.456.789-09",
    };

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload,
    });

    const body = parseJson<{ data: { id: string; email: string } }>(response.body);

    expect(response.statusCode).toBe(201);
    expect(mockedAuthService.register).toHaveBeenCalledWith({
      ...payload,
      email: "maria@bella.com",
    });
    expect(body.data).toMatchObject({
      id: "user-1",
      email: "maria@bella.com",
    });
  });

  it("deve retornar 200 e token no login valido", async () => {
    mockedAuthService.login.mockResolvedValue({
      token: "jwt-token",
      refreshToken: "refresh-token",
      expiresIn: "1d",
      refreshTokenExpiresIn: "7d",
      user: makeUserResponse(),
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        email: "maria@bella.com",
        password: "Senha@123",
      },
    });

    const body = parseJson<{ data: { token: string; refreshToken: string; user: { id: string } } }>(response.body);

    expect(response.statusCode).toBe(200);
    expect(body.data.token).toBe("jwt-token");
    expect(body.data.refreshToken).toBe("refresh-token");
    expect(body.data.user.id).toBe("user-1");
  });

  it("deve retornar 200 no logout valido", async () => {
    mockedAuthService.logout.mockResolvedValue(undefined);

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/logout",
      payload: {
        refreshToken: "refresh-token",
      },
    });

    const body = parseJson<{ data: { message: string } }>(response.body);

    expect(response.statusCode).toBe(200);
    expect(mockedAuthService.logout).toHaveBeenCalledWith("refresh-token");
    expect(body.data.message).toBe("Logout realizado com sucesso");
  });

  it("deve retornar 200 no refresh valido", async () => {
    mockedAuthService.refresh.mockResolvedValue({
      token: "next-jwt-token",
      refreshToken: "next-refresh-token",
      expiresIn: "1d",
      refreshTokenExpiresIn: "7d",
      user: makeUserResponse(),
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      payload: {
        refreshToken: "refresh-token",
      },
    });

    const body = parseJson<{ data: { token: string; refreshToken: string } }>(response.body);

    expect(response.statusCode).toBe(200);
    expect(mockedAuthService.refresh).toHaveBeenCalledWith({
      refreshToken: "refresh-token",
    });
    expect(body.data).toMatchObject({
      token: "next-jwt-token",
      refreshToken: "next-refresh-token",
    });
  });

  it("deve retornar 200 ao validar convite de ativacao", async () => {
    mockedAuthService.getActivationStatus.mockResolvedValue({
      clinicName: "Bella Clinic",
      email: "ana@bella.com",
      name: "Ana Souza",
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/auth/activation?token=invite-token",
    });

    const body = parseJson<{ data: { email: string; name: string } }>(response.body);

    expect(response.statusCode).toBe(200);
    expect(mockedAuthService.getActivationStatus).toHaveBeenCalledWith("invite-token");
    expect(body.data).toEqual({
      clinicName: "Bella Clinic",
      email: "ana@bella.com",
      name: "Ana Souza",
    });
  });

  it("deve retornar 200 ao ativar conta com token valido", async () => {
    mockedAuthService.activateAccount.mockResolvedValue({
      email: "ana@bella.com",
      name: "Ana Souza",
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/activate",
      payload: {
        token: "invite-token",
        password: "Senha@123",
      },
    });

    const body = parseJson<{ data: { email: string; name: string } }>(response.body);

    expect(response.statusCode).toBe(200);
    expect(mockedAuthService.activateAccount).toHaveBeenCalledWith({
      token: "invite-token",
      password: "Senha@123",
    });
    expect(body.data).toEqual({
      email: "ana@bella.com",
      name: "Ana Souza",
    });
  });

  it("deve retornar 401 quando login falhar", async () => {
    mockedAuthService.login.mockRejectedValue(
      new AppError(401, "INVALID_CREDENTIALS", "Credenciais inválidas."),
    );

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        email: "maria@bella.com",
        password: "errada",
      },
    });

    const body = parseJson<{ error: { code: string; message: string } }>(response.body);

    expect(response.statusCode).toBe(401);
    expect(body.error).toEqual({
      code: "INVALID_CREDENTIALS",
      message: "Credenciais inválidas.",
    });
  });
});
