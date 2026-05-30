import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../../lib/prisma";
import { AppError } from "../errors/app-error";

// Padroniza a resposta para qualquer falha relacionada à autenticação.
function invalidTokenError(): AppError {
  return new AppError(401, "INVALID_TOKEN", "Token inválido ou expirado.");
}

// Valida o access token e confirma se a sessão ainda está ativa.
export async function authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  if (request.method === "OPTIONS") {
    return;
  }

  try {
    await request.jwtVerify();
  } catch {
    throw invalidTokenError();
  }

  const userId = request.user?.userId;
  const sessionId = request.user?.sessionId;
  const type = request.user?.type;

  if (
    typeof userId !== "string" ||
    userId.trim().length === 0 ||
    typeof sessionId !== "string" ||
    sessionId.trim().length === 0 ||
    type !== "access"
  ) {
    throw invalidTokenError();
  }

  const activeSession = await prisma.refreshToken.findFirst({
    where: {
      id: sessionId,
      userId,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: { id: true },
  });

  if (!activeSession) {
    throw invalidTokenError();
  }
}
