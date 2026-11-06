import bcrypt from "bcrypt";
import { FastifyInstance } from "fastify";
import { buildApp } from "../../app/app";
import { prisma } from "../../lib/prisma";
import { createAuthenticatedUser } from "../helpers/auth-flow";
import { disconnectDatabase, resetDatabase } from "../helpers/database";
import { parseJson } from "../helpers/http";

type MultipartFile = {
  contents: Buffer;
  contentType: string;
  fileName: string;
};

function makeMultipartFile(file: MultipartFile) {
  const boundary = `bella-test-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const prefix = Buffer.from(
    `--${boundary}\r\n`
      + `Content-Disposition: form-data; name="photo"; filename="${file.fileName}"\r\n`
      + `Content-Type: ${file.contentType}\r\n\r\n`,
  );
  const suffix = Buffer.from(`\r\n--${boundary}--\r\n`);

  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    payload: Buffer.concat([prefix, file.contents, suffix]),
  };
}

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

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

  it("deve enviar, servir, substituir e remover a foto de perfil", async () => {
    const authenticated = await createAuthenticatedUser(app);
    const firstUpload = makeMultipartFile({
      contents: pngSignature,
      contentType: "image/png",
      fileName: "perfil.png",
    });

    const firstResponse = await app.inject({
      method: "POST",
      url: "/api/v1/users/me/avatar",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
        "content-type": firstUpload.contentType,
      },
      payload: firstUpload.payload,
    });
    const firstBody = parseJson<{ data: { avatarUrl: string } }>(firstResponse.body);

    expect(firstResponse.statusCode).toBe(200);
    expect(firstBody.data.avatarUrl).toMatch(
      /^\/api\/v1\/profile-images\/[0-9a-f-]+\.png$/,
    );

    const servedResponse = await app.inject({
      method: "GET",
      url: firstBody.data.avatarUrl,
    });

    expect(servedResponse.statusCode).toBe(200);
    expect(servedResponse.headers["content-type"]).toContain("image/png");

    const secondUpload = makeMultipartFile({
      contents: pngSignature,
      contentType: "image/png",
      fileName: "perfil-atualizado.png",
    });
    const secondResponse = await app.inject({
      method: "POST",
      url: "/api/v1/users/me/avatar",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
        "content-type": secondUpload.contentType,
      },
      payload: secondUpload.payload,
    });
    const secondBody = parseJson<{ data: { avatarUrl: string } }>(secondResponse.body);

    expect(secondResponse.statusCode).toBe(200);
    expect(secondBody.data.avatarUrl).not.toBe(firstBody.data.avatarUrl);

    const replacedImageResponse = await app.inject({
      method: "GET",
      url: firstBody.data.avatarUrl,
    });
    expect(replacedImageResponse.statusCode).toBe(404);

    const removeResponse = await app.inject({
      method: "DELETE",
      url: "/api/v1/users/me/avatar",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
    });
    const removeBody = parseJson<{ data: { avatarUrl: null } }>(removeResponse.body);

    expect(removeResponse.statusCode).toBe(200);
    expect(removeBody.data.avatarUrl).toBeNull();

    const removedImageResponse = await app.inject({
      method: "GET",
      url: secondBody.data.avatarUrl,
    });
    expect(removedImageResponse.statusCode).toBe(404);
  });

  it("deve rejeitar extensão incompatível, conteúdo falso e imagem maior que 5 MB", async () => {
    const authenticated = await createAuthenticatedUser(app);
    const authorization = `Bearer ${authenticated.token}`;
    const cases = [
      {
        expectedCode: "UNSUPPORTED_IMAGE_TYPE",
        expectedStatus: 415,
        file: {
          contents: pngSignature,
          contentType: "image/png",
          fileName: "perfil.exe",
        },
      },
      {
        expectedCode: "INVALID_IMAGE_CONTENT",
        expectedStatus: 415,
        file: {
          contents: Buffer.from("este arquivo não é uma imagem"),
          contentType: "image/png",
          fileName: "perfil.png",
        },
      },
      {
        expectedCode: "IMAGE_TOO_LARGE",
        expectedStatus: 413,
        file: {
          contents: Buffer.concat([pngSignature, Buffer.alloc(5 * 1024 * 1024)]),
          contentType: "image/png",
          fileName: "perfil.png",
        },
      },
    ];

    for (const testCase of cases) {
      const upload = makeMultipartFile(testCase.file);
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/users/me/avatar",
        headers: {
          authorization,
          "content-type": upload.contentType,
        },
        payload: upload.payload,
      });
      const body = parseJson<{ error: { code: string } }>(response.body);

      expect(response.statusCode).toBe(testCase.expectedStatus);
      expect(body.error.code).toBe(testCase.expectedCode);
    }

    const persistedUser = await prisma.user.findUniqueOrThrow({
      where: { id: authenticated.userId },
    });
    expect(persistedUser.avatarFileName).toBeNull();
  });

  it("deve exigir a senha atual e excluir definitivamente a conta", async () => {
    const authenticated = await createAuthenticatedUser(app);

    const wrongPasswordResponse = await app.inject({
      method: "DELETE",
      url: "/api/v1/users/me",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
      payload: {
        password: "SenhaIncorreta@123",
        confirmation: "EXCLUIR",
      },
    });
    const wrongPasswordBody = parseJson<{ error: { code: string } }>(
      wrongPasswordResponse.body,
    );

    expect(wrongPasswordResponse.statusCode).toBe(401);
    expect(wrongPasswordBody.error.code).toBe("INVALID_CREDENTIALS");
    expect(
      await prisma.user.findUnique({ where: { id: authenticated.userId } }),
    ).not.toBeNull();

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: "/api/v1/users/me",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
      payload: {
        password: authenticated.credentials.password,
        confirmation: "EXCLUIR",
      },
    });

    expect(deleteResponse.statusCode).toBe(204);
    expect(
      await prisma.user.findUnique({ where: { id: authenticated.userId } }),
    ).toBeNull();

    const staleTokenResponse = await app.inject({
      method: "GET",
      url: "/api/v1/users/me",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
    });
    expect(staleTokenResponse.statusCode).toBe(401);
  });
});
