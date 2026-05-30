import { FastifyInstance } from "fastify";
import { buildApp } from "../../app/app";
import { createAuthenticatedUser } from "../helpers/auth-flow";
import { disconnectDatabase, resetDatabase } from "../helpers/database";
import { parseJson } from "../helpers/http";

describe("rooms integration", () => {
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

  it("deve exigir autenticação em todas as rotas de salas", async () => {
    const requests = [
      { method: "GET", url: "/api/v1/rooms" },
      {
        method: "POST",
        url: "/api/v1/rooms",
        payload: {
          name: "Sala 1",
          active: true,
        },
      },
      { method: "GET", url: "/api/v1/rooms/4c7d1d0a-d708-4ce6-8d4e-930d7ef67a30" },
      {
        method: "PUT",
        url: "/api/v1/rooms/4c7d1d0a-d708-4ce6-8d4e-930d7ef67a30",
        payload: {
          name: "Sala 1",
          active: true,
        },
      },
      { method: "DELETE", url: "/api/v1/rooms/4c7d1d0a-d708-4ce6-8d4e-930d7ef67a30" },
    ] as const;

    for (const request of requests) {
      const response = await app.inject(request);
      const body = parseJson<{ error: { code: string } }>(response.body);

      expect(response.statusCode).toBe(401);
      expect(body.error.code).toBe("INVALID_TOKEN");
    }
  });

  it("deve validar campos obrigatórios e a cor hexadecimal da sala", async () => {
    const authenticated = await createAuthenticatedUser(app);

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/rooms",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
      payload: {
        color: "rosa",
      },
    });

    const body = parseJson<{
      error: { code: string; details?: Array<{ path: string; message: string }> };
    }>(response.body);

    expect(response.statusCode).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "name" }),
        expect.objectContaining({ path: "active" }),
        expect.objectContaining({ path: "color" }),
      ]),
    );
  });

  it("deve executar CRUD completo de salas com filtros, paginação e isolamento por usuário", async () => {
    const owner = await createAuthenticatedUser(app);
    const outsider = await createAuthenticatedUser(app);

    const firstRoomResponse = await app.inject({
      method: "POST",
      url: "/api/v1/rooms",
      headers: {
        authorization: `Bearer ${owner.token}`,
      },
      payload: {
        name: "Sala Procedimentos",
        color: "#E8D8E2",
        active: true,
      },
    });

    const secondRoomResponse = await app.inject({
      method: "POST",
      url: "/api/v1/rooms",
      headers: {
        authorization: `Bearer ${owner.token}`,
      },
      payload: {
        name: "Sala Apoio",
        color: "#D97EA4",
        active: false,
      },
    });

    const firstRoomBody = parseJson<{ data: { id: string; status: string } }>(firstRoomResponse.body);
    const secondRoomBody = parseJson<{ data: { id: string } }>(secondRoomResponse.body);

    expect(firstRoomResponse.statusCode).toBe(201);
    expect(firstRoomBody.data.status).toBe("ativo");
    expect(secondRoomResponse.statusCode).toBe(201);

    const listResponse = await app.inject({
      method: "GET",
      url: "/api/v1/rooms?page=1&limit=1&search=Sala&active=true",
      headers: {
        authorization: `Bearer ${owner.token}`,
      },
    });

    const listBody = parseJson<{
      data: Array<{ id: string; name: string; status: string }>;
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>(listResponse.body);

    expect(listResponse.statusCode).toBe(200);
    expect(listBody.meta).toEqual({
      page: 1,
      limit: 1,
      total: 1,
      totalPages: 1,
    });
    expect(listBody.data).toEqual([
      expect.objectContaining({
        id: firstRoomBody.data.id,
        name: "Sala Procedimentos",
        status: "ativo",
      }),
    ]);

    const getResponse = await app.inject({
      method: "GET",
      url: `/api/v1/rooms/${firstRoomBody.data.id}`,
      headers: {
        authorization: `Bearer ${owner.token}`,
      },
    });

    const getBody = parseJson<{ data: { id: string; color: string | null } }>(getResponse.body);

    expect(getResponse.statusCode).toBe(200);
    expect(getBody.data).toMatchObject({
      id: firstRoomBody.data.id,
      color: "#E8D8E2",
    });

    const outsiderResponse = await app.inject({
      method: "GET",
      url: `/api/v1/rooms/${firstRoomBody.data.id}`,
      headers: {
        authorization: `Bearer ${outsider.token}`,
      },
    });

    const outsiderBody = parseJson<{ error: { code: string } }>(outsiderResponse.body);

    expect(outsiderResponse.statusCode).toBe(404);
    expect(outsiderBody.error.code).toBe("RESOURCE_NOT_FOUND");

    const updateResponse = await app.inject({
      method: "PUT",
      url: `/api/v1/rooms/${firstRoomBody.data.id}`,
      headers: {
        authorization: `Bearer ${owner.token}`,
      },
      payload: {
        name: "Sala Procedimentos Premium",
        color: "#ABCDEF",
        active: false,
      },
    });

    const updateBody = parseJson<{ data: { name: string; status: string; color: string | null } }>(updateResponse.body);

    expect(updateResponse.statusCode).toBe(200);
    expect(updateBody.data).toMatchObject({
      name: "Sala Procedimentos Premium",
      status: "inativo",
      color: "#ABCDEF",
    });

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/api/v1/rooms/${secondRoomBody.data.id}`,
      headers: {
        authorization: `Bearer ${owner.token}`,
      },
    });

    expect(deleteResponse.statusCode).toBe(204);

    const deletedGetResponse = await app.inject({
      method: "GET",
      url: `/api/v1/rooms/${secondRoomBody.data.id}`,
      headers: {
        authorization: `Bearer ${owner.token}`,
      },
    });

    const deletedGetBody = parseJson<{ error: { code: string } }>(deletedGetResponse.body);

    expect(deletedGetResponse.statusCode).toBe(404);
    expect(deletedGetBody.error.code).toBe("RESOURCE_NOT_FOUND");
  });

  it("deve retornar 404 ao editar ou remover uma sala inexistente", async () => {
    const authenticated = await createAuthenticatedUser(app);
    const roomId = "4c7d1d0a-d708-4ce6-8d4e-930d7ef67a30";

    const updateResponse = await app.inject({
      method: "PUT",
      url: `/api/v1/rooms/${roomId}`,
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
      payload: {
        name: "Sala Fantasma",
        color: "#E8D8E2",
        active: true,
      },
    });

    const updateBody = parseJson<{ error: { code: string } }>(updateResponse.body);

    expect(updateResponse.statusCode).toBe(404);
    expect(updateBody.error.code).toBe("RESOURCE_NOT_FOUND");

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/api/v1/rooms/${roomId}`,
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
    });

    const deleteBody = parseJson<{ error: { code: string } }>(deleteResponse.body);

    expect(deleteResponse.statusCode).toBe(404);
    expect(deleteBody.error.code).toBe("RESOURCE_NOT_FOUND");
  });
});
