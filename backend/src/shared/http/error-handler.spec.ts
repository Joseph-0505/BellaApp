import Fastify, { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { z, ZodError } from "zod";
import { AppError } from "../errors/app-error";
import { registerErrorHandler } from "./error-handler";

function createKnownRequestError(code: string, meta?: Record<string, unknown>): Prisma.PrismaClientKnownRequestError {
  const error = Object.assign(new Error(`Prisma error ${code}`), {
    code,
    clientVersion: "test",
    meta,
  });

  Object.setPrototypeOf(error, Prisma.PrismaClientKnownRequestError.prototype);

  return error as Prisma.PrismaClientKnownRequestError;
}

describe("registerErrorHandler", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    registerErrorHandler(app);

    app.get("/app-error", async () => {
      throw new AppError(422, "INVALID_STATE", "Estado inválido.", {
        field: "status",
      });
    });

    app.get("/zod-error", async () => {
      throw new ZodError([
        {
          code: z.ZodIssueCode.custom,
          path: ["body", "email"],
          message: "Email inválido.",
        },
      ]);
    });

    app.get("/prisma/:kind", async (request) => {
      const { kind } = request.params as { kind: string };

      if (kind === "not-found") {
        throw createKnownRequestError("P2025");
      }

      const targetByKind: Record<string, string[]> = {
        email: ["email"],
        cnpj: ["cnpj"],
        cpf: ["cpf"],
        other: ["phone"],
      };

      throw createKnownRequestError("P2002", {
        target: targetByKind[kind] ?? targetByKind.other,
      });
    });

    app.get("/auth-status", async () => {
      throw Object.assign(new Error("Unauthorized"), {
        statusCode: 401,
      });
    });

    app.get("/auth-code", async () => {
      throw Object.assign(new Error("JWT invalid"), {
        code: "FST_JWT_AUTHORIZATION_TOKEN_INVALID",
      });
    });

    app.get("/generic", async () => {
      throw new Error("Boom");
    });

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve responder AppError preservando detalhes", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/app-error",
    });

    expect(response.statusCode).toBe(422);
    expect(JSON.parse(response.body)).toEqual({
      error: {
        code: "INVALID_STATE",
        message: "Estado inválido.",
        details: {
          field: "status",
        },
      },
    });
  });

  it("deve traduzir ZodError para payload de validação", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/zod-error",
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Dados inválidos.",
        details: [
          {
            path: "body.email",
            message: "Email inválido.",
          },
        ],
      },
    });
  });

  it.each([
    ["email", "EMAIL_ALREADY_EXISTS", "Email já cadastrado."],
    ["cnpj", "CNPJ_ALREADY_EXISTS", "CNPJ já cadastrado."],
    ["cpf", "CPF_ALREADY_EXISTS", "CPF já cadastrado."],
    ["other", "VALIDATION_ERROR", "Conflito de unicidade."],
  ])("deve traduzir P2002 para %s", async (kind, code, message) => {
    const response = await app.inject({
      method: "GET",
      url: `/prisma/${kind}`,
    });

    expect(response.statusCode).toBe(409);
    expect(JSON.parse(response.body)).toEqual({
      error: {
        code,
        message,
      },
    });
  });

  it("deve traduzir P2025 para recurso não encontrado", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/prisma/not-found",
    });

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body)).toEqual({
      error: {
        code: "RESOURCE_NOT_FOUND",
        message: "Recurso não encontrado.",
      },
    });
  });

  it("deve traduzir erro 401 genérico de autenticação", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/auth-status",
    });

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toEqual({
      error: {
        code: "INVALID_TOKEN",
        message: "Token inválido ou expirado.",
      },
    });
  });

  it("deve traduzir erro JWT do Fastify", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/auth-code",
    });

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toEqual({
      error: {
        code: "INVALID_TOKEN",
        message: "Token inválido ou expirado.",
      },
    });
  });

  it("deve responder 500 para erros inesperados", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/generic",
    });

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro interno do servidor.",
      },
    });
  });
});