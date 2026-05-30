import bcrypt from "bcrypt";
import { FastifyInstance } from "fastify";
import { buildApp } from "../../app/app";
import { prisma } from "../../lib/prisma";
import { createAuthenticatedUser } from "../helpers/auth-flow";
import { disconnectDatabase, resetDatabase } from "../helpers/database";
import { parseJson } from "../helpers/http";

describe("users integration", () => {
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

  it("deve retornar 401 em GET /users/me sem token", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/users/me",
    });

    const body = parseJson<{ error: { code: string } }>(response.body);

    expect(response.statusCode).toBe(401);
    expect(body.error.code).toBe("INVALID_TOKEN");
  });

  it("deve retornar o usuário autenticado em GET /users/me", async () => {
    const authenticated = await createAuthenticatedUser(app);

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/users/me",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
    });

    const body = parseJson<{ data: { id: string; email: string } }>(
      response.body,
    );

    expect(response.statusCode).toBe(200);
    expect(body.data).toMatchObject({
      id: authenticated.userId,
      email: authenticated.credentials.email,
    });
  });

  it("deve retornar 401 quando o token pertence a um usuário removido", async () => {
    const authenticated = await createAuthenticatedUser(app);

    await prisma.user.delete({
      where: {
        id: authenticated.userId,
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/users/me",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
    });

    const body = parseJson<{ error: { code: string } }>(response.body);

    expect(response.statusCode).toBe(401);
    expect(body.error.code).toBe("INVALID_TOKEN");
  });

  it("deve rejeitar tentativa de alterar email no update", async () => {
    const authenticated = await createAuthenticatedUser(app);

    const response = await app.inject({
      method: "PUT",
      url: "/api/v1/users/me",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
      payload: {
        name: "Usuário Alterado",
        email: "novo@bella.com",
        cpf: authenticated.credentials.cpf,
        password: "Senha@123",
      },
    });

    const body = parseJson<{ error: { code: string } }>(response.body);

    expect(response.statusCode).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("deve atualizar nome e senha mantendo o email intacto", async () => {
    const authenticated = await createAuthenticatedUser(app);

    const response = await app.inject({
      method: "PUT",
      url: "/api/v1/users/me",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
      payload: {
        name: "Usuário Editado",
        cpf: authenticated.credentials.cpf,
        password: "NovaSenha@123",
      },
    });

    const body = parseJson<{
      data: { id: string; name: string; email: string };
    }>(response.body);
    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: {
        id: authenticated.userId,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(body.data).toMatchObject({
      id: authenticated.userId,
      name: "Usuário Editado",
      email: authenticated.credentials.email,
    });
    expect(updatedUser.passwordHash).not.toBeNull();
    expect(
      await bcrypt.compare("NovaSenha@123", updatedUser.passwordHash as string),
    ).toBe(true);
  });
});
