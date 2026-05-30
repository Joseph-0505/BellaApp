import { FastifyInstance, FastifyRequest } from "fastify";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError, AppErrorDetails } from "../errors/app-error";

type ErrorResponsePayload = {
  code: string;
  message: string;
  details?: AppErrorDetails;
};

type LogHandledErrorArgs = {
  appPayload: ErrorResponsePayload;
  request: FastifyRequest;
  statusCode: number;
  error?: object;
};

// Traduz erros conhecidos de unicidade do Prisma para códigos de negócio mais claros.
function mapUniqueConstraint(error: Prisma.PrismaClientKnownRequestError): AppError {
  const target = Array.isArray(error.meta?.target) ? error.meta.target.join(",") : String(error.meta?.target ?? "");

  if (target.includes("email")) {
    return new AppError(409, "EMAIL_ALREADY_EXISTS", "Email já cadastrado.");
  }

  if (target.includes("cnpj")) {
    return new AppError(409, "CNPJ_ALREADY_EXISTS", "CNPJ já cadastrado.");
  }

  if (target.includes("cpf")) {
    return new AppError(409, "CPF_ALREADY_EXISTS", "CPF já cadastrado.");
  }

  return new AppError(409, "VALIDATION_ERROR", "Conflito de unicidade.");
}

// Registra em log somente os dados relevantes para erros tratados pela aplicação.
function logHandledError(
  args: LogHandledErrorArgs,
): void {
  const { appPayload, request, statusCode, error } = args;
  const logPayload = {
    statusCode,
    code: appPayload.code,
    message: appPayload.message,
    method: request.method,
    url: request.url,
    ...(appPayload.details !== undefined ? { details: appPayload.details } : {}),
  };

  if (statusCode >= 500) {
    request.log.error({
      ...logPayload,
      ...(error ? { err: error } : {}),
    });
    return;
  }

  request.log.warn(logPayload);
}

// Converte erros técnicos e de validação em respostas HTTP padronizadas.
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: Error, request, reply) => {
    if (error instanceof AppError) {
      const errorPayload = {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
      };

      logHandledError({ appPayload: errorPayload, request, statusCode: error.statusCode, error });

      return reply.status(error.statusCode).send({
        error: errorPayload,
      });
    }

    if (error instanceof ZodError) {
      const errorPayload = {
        code: "VALIDATION_ERROR",
        message: "Dados inválidos.",
        details: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      };

      logHandledError({ appPayload: errorPayload, request, statusCode: 400, error });

      return reply.status(400).send({
        error: errorPayload,
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const appError = mapUniqueConstraint(error);
        const errorPayload = {
          code: appError.code,
          message: appError.message,
          ...(appError.details !== undefined ? { details: appError.details } : {}),
        };

        logHandledError({ appPayload: errorPayload, request, statusCode: appError.statusCode, error });

        return reply.status(appError.statusCode).send({
          error: errorPayload,
        });
      }

      if (error.code === "P2025") {
        const errorPayload = {
          code: "RESOURCE_NOT_FOUND",
          message: "Recurso não encontrado.",
        };

        logHandledError({ appPayload: errorPayload, request, statusCode: 404, error });

        return reply.status(404).send({
          error: errorPayload,
        });
      }
    }

    const authError = error as { statusCode?: number; code?: string };

    if (authError.statusCode === 401 || authError.code?.startsWith("FST_JWT")) {
      const errorPayload = {
        code: "INVALID_TOKEN",
        message: "Token inválido ou expirado.",
      };

      logHandledError({ appPayload: errorPayload, request, statusCode: 401, error });

      return reply.status(401).send({
        error: errorPayload,
      });
    }

    logHandledError({
      appPayload: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro interno do servidor.",
      },
      request,
      statusCode: 500,
      error,
    });

    return reply.status(500).send({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro interno do servidor.",
      },
    });
  });
}
