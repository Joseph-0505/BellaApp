import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { TokenExpiredError } from "jsonwebtoken";
import { env } from "../../config/env";
import {
  decodeAuthToken,
  getTokenExpirationDate,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../shared/auth/jwt";
import { AppError } from "../../shared/errors/app-error";
import { toUserResponse } from "../../shared/mappers/user-response";
import { normalizeNumericString } from "../../shared/utils/documents";
import {
  ActivateAccountRequestDto,
  ActivateAccountResponseDto,
  ActivationStatusResponseDto,
  LoginRequestDto,
  LoginResponseDto,
  RefreshTokenRequestDto,
  RefreshTokenResponseDto,
  RegisterRequestDto,
  RegisterResponseDto,
} from "./auth.dtos";
import { authRepository } from "./auth.repository";

type AuthUserRecord = NonNullable<Awaited<ReturnType<typeof authRepository.findUserByEmail>>>;
type ActivationInviteRecord = NonNullable<Awaited<ReturnType<typeof authRepository.findInviteTokenByHash>>>;
type RefreshSessionRecord = NonNullable<Awaited<ReturnType<typeof authRepository.findRefreshSession>>>;

function invalidRefreshTokenError(message = "Refresh token invalido."): AppError {
  return new AppError(401, "INVALID_REFRESH_TOKEN", message);
}

function inactiveAccountError(): AppError {
  return new AppError(
    403,
    "ACCOUNT_NOT_ACTIVATED",
    "Sua conta ainda nao foi ativada. Verifique o convite enviado por e-mail para criar a senha.",
  );
}

function invalidInviteError(message = "Convite invalido."): AppError {
  return new AppError(400, "INVITE_TOKEN_INVALID", message);
}

function usedInviteError(): AppError {
  return new AppError(409, "INVITE_TOKEN_USED", "Esse convite ja foi utilizado.");
}

function expiredInviteError(): AppError {
  return new AppError(410, "INVITE_TOKEN_EXPIRED", "Esse convite expirou. Solicite um novo link para a clinica.");
}

function accountAlreadyActiveError(): AppError {
  return new AppError(409, "ACCOUNT_ALREADY_ACTIVE", "Essa conta ja foi ativada. Faça login normalmente.");
}

class AuthService {
  private async assertRegisterAvailability(email: string, cpf: string, cnpj?: string): Promise<void> {
    const [userByEmail, userByCpf, businessByCnpj] = await Promise.all([
      authRepository.findUserByEmail(email),
      authRepository.findUserByCpf(cpf),
      cnpj ? authRepository.findBusinessProfileByCnpj(cnpj) : Promise.resolve(null),
    ]);

    if (userByEmail) throw new AppError(409, "EMAIL_ALREADY_EXISTS", "Email ja cadastrado.");
    if (userByCpf) throw new AppError(409, "CPF_ALREADY_EXISTS", "CPF ja cadastrado.");
    if (businessByCnpj) throw new AppError(409, "CNPJ_ALREADY_EXISTS", "CNPJ ja cadastrado.");
  }

  private buildRegisterPayload(args: {
    input: RegisterRequestDto;
    passwordHash: string;
    cpf: string;
    cnpj?: string;
  }) {
    const { input, passwordHash, cpf, cnpj } = args;

    return {
      user: {
        name: input.name,
        email: input.email,
        passwordHash,
        cpf,
      },
      ...(input.businessName
        ? {
            businessProfile: {
              businessName: input.businessName,
              cnpj: cnpj ?? null,
            },
          }
        : {}),
    };
  }

  private async getAuthenticatedUser(input: LoginRequestDto): Promise<AuthUserRecord> {
    const user = await authRepository.findUserByEmail(input.email);

    if (!user) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Credenciais inválidas.");
    }

    if (!user.passwordHash) {
      throw inactiveAccountError();
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

    if (!passwordMatches) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Credenciais inválidas.");
    }

    return user;
  }

  private async createSession(userId: string) {
    const sessionId = randomUUID();
    const refreshToken = signRefreshToken(userId, sessionId);

    await authRepository.createRefreshSession({
      id: sessionId,
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: getTokenExpirationDate(refreshToken),
    });

    return { sessionId, refreshToken };
  }

  private async resolveRefreshPayload(refreshToken: string) {
    try {
      return verifyRefreshToken(refreshToken);
    } catch (error) {
      const decodedToken = decodeAuthToken(refreshToken);

      if (error instanceof TokenExpiredError && decodedToken?.type === "refresh") {
        await authRepository.deleteRefreshSession(decodedToken.sessionId);
        throw invalidRefreshTokenError("Refresh token expirado.");
      }

      throw invalidRefreshTokenError();
    }
  }

  private async getStoredRefreshTokenOrThrow(
    sessionId: string,
    userId: string,
    refreshToken: string,
  ): Promise<RefreshSessionRecord> {
    const storedRefreshToken = await authRepository.findRefreshSession(sessionId, hashToken(refreshToken));

    if (!storedRefreshToken || storedRefreshToken.userId !== userId) {
      throw invalidRefreshTokenError();
    }

    if (storedRefreshToken.expiresAt.getTime() <= Date.now()) {
      await authRepository.deleteRefreshSession(sessionId);
      throw invalidRefreshTokenError("Refresh token expirado.");
    }

    return storedRefreshToken;
  }

  private async getActivationInviteOrThrow(rawToken: string): Promise<ActivationInviteRecord> {
    const tokenHash = hashToken(rawToken);
    const invite = await authRepository.findInviteTokenByHash(tokenHash);

    if (!invite) {
      throw invalidInviteError();
    }

    if (invite.usedAt) {
      throw usedInviteError();
    }

    if (invite.expiresAt.getTime() <= Date.now()) {
      throw expiredInviteError();
    }

    if (invite.user.passwordHash) {
      throw accountAlreadyActiveError();
    }

    return invite;
  }

  async register(input: RegisterRequestDto): Promise<RegisterResponseDto> {
    const cpf = normalizeNumericString(input.cpf);
    const cnpj = input.cnpj ? normalizeNumericString(input.cnpj) : undefined;
    await this.assertRegisterAvailability(input.email, cpf, cnpj);
    const passwordHash = await bcrypt.hash(input.password, 10);
    const createdUser = await authRepository.createUserWithBusinessProfile(
      this.buildRegisterPayload({
        input,
        passwordHash,
        cpf,
        ...(cnpj ? { cnpj } : {}),
      }),
    );

    return toUserResponse(createdUser);
  }

  async login(input: LoginRequestDto): Promise<LoginResponseDto> {
    const user = await this.getAuthenticatedUser(input);
    const { sessionId, refreshToken } = await this.createSession(user.id);

    return {
      token: signAccessToken(user.id, sessionId),
      refreshToken,
      expiresIn: env.JWT_EXPIRES_IN,
      refreshTokenExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
      user: toUserResponse(user),
    };
  }

  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) return;

    const decodedToken = decodeAuthToken(refreshToken);

    if (!decodedToken || decodedToken.type !== "refresh") {
      return;
    }

    const existingSession = await authRepository.findRefreshSession(decodedToken.sessionId, hashToken(refreshToken));

    if (!existingSession) {
      return;
    }

    await authRepository.deleteRefreshSession(decodedToken.sessionId);
  }

  async refresh(input: RefreshTokenRequestDto): Promise<RefreshTokenResponseDto> {
    const refreshPayload = await this.resolveRefreshPayload(input.refreshToken);
    const storedRefreshToken = await this.getStoredRefreshTokenOrThrow(
      refreshPayload.sessionId,
      refreshPayload.userId,
      input.refreshToken,
    );

    const nextSessionId = randomUUID();
    const nextRefreshToken = signRefreshToken(storedRefreshToken.userId, nextSessionId);

    await authRepository.rotateRefreshSession(refreshPayload.sessionId, {
      id: nextSessionId,
      userId: storedRefreshToken.userId,
      tokenHash: hashToken(nextRefreshToken),
      expiresAt: getTokenExpirationDate(nextRefreshToken),
    });

    return {
      token: signAccessToken(storedRefreshToken.user.id, nextSessionId),
      refreshToken: nextRefreshToken,
      expiresIn: env.JWT_EXPIRES_IN,
      refreshTokenExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
      user: toUserResponse(storedRefreshToken.user),
    };
  }

  async getActivationStatus(token: string): Promise<ActivationStatusResponseDto> {
    const invite = await this.getActivationInviteOrThrow(token);
    const clinicName = invite.user.clinicUsers[0]?.clinic.businessProfile?.businessName || "BellaApp";

    return {
      clinicName,
      email: invite.user.email,
      name: invite.user.name,
    };
  }

  async activateAccount(input: ActivateAccountRequestDto): Promise<ActivateAccountResponseDto> {
    const invite = await this.getActivationInviteOrThrow(input.token);
    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await authRepository.activateUserFromInvite({
      inviteTokenId: invite.id,
      userId: invite.user.id,
      passwordHash,
    });

    return {
      email: user.email,
      name: user.name,
    };
  }
}

export const authService = new AuthService();
