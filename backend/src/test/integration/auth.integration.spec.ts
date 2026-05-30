import bcrypt from "bcrypt";
import { FastifyInstance } from "fastify";
import { buildApp } from "../../app/app";
import { prisma } from "../../lib/prisma";
import { createAuthenticatedUser, registerUser } from "../helpers/auth-flow";
import { disconnectDatabase, resetDatabase } from "../helpers/database";
import { parseJson } from "../helpers/http";

describe("auth integration", () => {
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

  it("deve cadastrar usuário e salvar senha com hash no banco", async () => {
    const { payload, response } = await registerUser(app);
    const body = parseJson<{ data: { id: string; email: string; cpf: string } }>(response.body);
    const createdUser = await prisma.user.findUnique({
      where: {
        email: payload.email,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(body.data.email).toBe(payload.email);
    expect(createdUser).not.toBeNull();
    expect(createdUser?.passwordHash).not.toBe(payload.password);
    expect(await bcrypt.compare(payload.password, createdUser?.passwordHash ?? "")).toBe(true);
  });

  it("deve bloquear cadastro com email duplicado", async () => {
    const registered = await registerUser(app, {
      email: "duplicado@bella.com",
    });

    expect(registered.response.statusCode).toBe(201);

    const duplicated = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        name: "Outro Usuário",
        email: "duplicado@bella.com",
        password: "Senha@123",
        cpf: "11144477735",
      },
    });

    const body = parseJson<{ error: { code: string; message: string } }>(duplicated.body);

    expect(duplicated.statusCode).toBe(409);
    expect(body.error.code).toBe("EMAIL_ALREADY_EXISTS");
  });

  it("deve autenticar usuário existente e retornar JWT", async () => {
    const authenticated = await createAuthenticatedUser(app);

    expect(typeof authenticated.token).toBe("string");
    expect(authenticated.token.length).toBeGreaterThan(20);
    expect(typeof authenticated.refreshToken).toBe("string");
    expect(authenticated.refreshToken.length).toBeGreaterThan(20);
  });

  it("deve rejeitar login com senha incorreta", async () => {
    const registered = await registerUser(app);

    expect(registered.response.statusCode).toBe(201);

    const wrongPassword = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        email: registered.payload.email,
        password: "SenhaErrada@123",
      },
    });

    const body = parseJson<{ error: { code: string; message: string } }>(wrongPassword.body);

    expect(wrongPassword.statusCode).toBe(401);
    expect(body.error).toEqual({
      code: "INVALID_CREDENTIALS",
      message: "Credenciais inválidas.",
    });
  });

  it("deve rejeitar refresh token em rota protegida", async () => {
    const authenticated = await createAuthenticatedUser(app);

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/users/me",
      headers: {
        authorization: `Bearer ${authenticated.refreshToken}`,
      },
    });

    const body = parseJson<{ error: { code: string } }>(response.body);

    expect(response.statusCode).toBe(401);
    expect(body.error.code).toBe("INVALID_TOKEN");
  });

  it("deve rotacionar a sessão no refresh e invalidar os tokens anteriores", async () => {
    const authenticated = await createAuthenticatedUser(app);

    const refreshResponse = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      payload: {
        refreshToken: authenticated.refreshToken,
      },
    });

    const refreshBody = parseJson<{
      data: { token: string; refreshToken: string; user: { id: string } };
    }>(refreshResponse.body);

    expect(refreshResponse.statusCode).toBe(200);
    expect(refreshBody.data.user.id).toBe(authenticated.userId);
    expect(refreshBody.data.token).not.toBe(authenticated.token);
    expect(refreshBody.data.refreshToken).not.toBe(authenticated.refreshToken);

    const oldAccessResponse = await app.inject({
      method: "GET",
      url: "/api/v1/users/me",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
    });

    const newAccessResponse = await app.inject({
      method: "GET",
      url: "/api/v1/users/me",
      headers: {
        authorization: `Bearer ${refreshBody.data.token}`,
      },
    });

    const reusedRefreshResponse = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      payload: {
        refreshToken: authenticated.refreshToken,
      },
    });

    expect(oldAccessResponse.statusCode).toBe(401);
    expect(newAccessResponse.statusCode).toBe(200);
    expect(reusedRefreshResponse.statusCode).toBe(401);
  });

  it("deve invalidar a sessão imediatamente no logout", async () => {
    const authenticated = await createAuthenticatedUser(app);

    const logoutResponse = await app.inject({
      method: "POST",
      url: "/api/v1/auth/logout",
      payload: {
        refreshToken: authenticated.refreshToken,
      },
    });

    const logoutBody = parseJson<{ data: { message: string } }>(logoutResponse.body);

    const accessAfterLogout = await app.inject({
      method: "GET",
      url: "/api/v1/users/me",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
    });

    const refreshAfterLogout = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      payload: {
        refreshToken: authenticated.refreshToken,
      },
    });

    expect(logoutResponse.statusCode).toBe(200);
    expect(logoutBody.data.message).toBe("Logout realizado com sucesso");
    expect(accessAfterLogout.statusCode).toBe(401);
    expect(refreshAfterLogout.statusCode).toBe(401);
  });
});
