import crypto from "node:crypto";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { env } from "../../config/env";

export type AuthTokenType = "access" | "refresh";

export type AuthTokenPayload = JwtPayload & {
  userId: string;
  sessionId: string;
  type: AuthTokenType;
};

function isAuthTokenPayload(payload: JwtPayload | string | null): payload is AuthTokenPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    typeof (payload as AuthTokenPayload).userId === "string" &&
    typeof (payload as AuthTokenPayload).sessionId === "string" &&
    ((payload as AuthTokenPayload).type === "access" || (payload as AuthTokenPayload).type === "refresh")
  );
}

function signToken(
  payload: {
    userId: string;
    sessionId: string;
    type: AuthTokenType;
  },
  expiresIn: NonNullable<SignOptions["expiresIn"]>,
): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn,
  });
}

// Emite o token de acesso usado pelas rotas autenticadas.
export function signAccessToken(userId: string, sessionId: string): string {
  const expiresIn = env.JWT_EXPIRES_IN as NonNullable<SignOptions["expiresIn"]>;

  return signToken({ userId, sessionId, type: "access" }, expiresIn);
}

// Emite o refresh token persistido no banco para renovação de sessão.
export function signRefreshToken(userId: string, sessionId: string): string {
  const expiresIn = env.REFRESH_TOKEN_EXPIRES_IN as NonNullable<SignOptions["expiresIn"]>;

  return signToken({ userId, sessionId, type: "refresh" }, expiresIn);
}

// Valida assinatura e claims mínimos do refresh token antes da rotação da sessão.
export function verifyRefreshToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);

  if (!isAuthTokenPayload(decoded) || decoded.type !== "refresh") {
    throw new Error("Refresh token inválido.");
  }

  return decoded;
}

// Decodifica claims do token sem confiar na assinatura; usado apenas para limpeza defensiva de sessão.
export function decodeAuthToken(token: string): AuthTokenPayload | null {
  const decoded = jwt.decode(token);

  if (!isAuthTokenPayload(decoded)) {
    return null;
  }

  return decoded;
}

// Extrai a expiração do JWT para persisti-la junto com o refresh token.
export function getTokenExpirationDate(token: string): Date {
  const decoded = decodeAuthToken(token);

  if (!decoded || typeof decoded.exp !== "number") {
    throw new Error("Token inválido.");
  }

  return new Date(decoded.exp * 1000);
}

// Persiste somente um hash determinístico do refresh token para reduzir impacto de vazamento do banco.
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
