jest.mock("bcrypt", () => ({
  __esModule: true,
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

jest.mock("./auth.repository", () => ({
  authRepository: {
    findUserByEmail: jest.fn(),
    findUserByCpf: jest.fn(),
    findBusinessProfileByCnpj: jest.fn(),
    findRefreshSession: jest.fn(),
    findInviteTokenByHash: jest.fn(),
    createUserWithBusinessProfile: jest.fn(),
    createRefreshSession: jest.fn(),
    deleteRefreshSession: jest.fn(),
    rotateRefreshSession: jest.fn(),
    replaceInviteToken: jest.fn(),
    activateUserFromInvite: jest.fn(),
  },
}));

jest.mock("../../shared/auth/jwt", () => ({
  decodeAuthToken: jest.fn(),
  getTokenExpirationDate: jest.fn(),
  hashToken: jest.fn(),
  signAccessToken: jest.fn(),
  signRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

import bcrypt from "bcrypt";
import {
  decodeAuthToken,
  getTokenExpirationDate,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../shared/auth/jwt";
import { authRepository } from "./auth.repository";
import { authService } from "./auth.service";

const mockedHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;
const mockedCompare = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;
const mockedDecodeAuthToken = decodeAuthToken as jest.MockedFunction<typeof decodeAuthToken>;
const mockedGetTokenExpirationDate = getTokenExpirationDate as jest.MockedFunction<typeof getTokenExpirationDate>;
const mockedHashToken = hashToken as jest.MockedFunction<typeof hashToken>;
const mockedSignAccessToken = signAccessToken as jest.MockedFunction<typeof signAccessToken>;
const mockedSignRefreshToken = signRefreshToken as jest.MockedFunction<typeof signRefreshToken>;
const mockedVerifyRefreshToken = verifyRefreshToken as jest.MockedFunction<typeof verifyRefreshToken>;
const mockedAuthRepository = authRepository as jest.Mocked<typeof authRepository>;

function makeUserRecord(overrides = {}) {
  return {
    id: "user-1",
    name: "Maria Silva",
    email: "maria@bella.com",
    passwordHash: "hashed-password",
    cpf: "12345678909",
    businessProfile: null,
    clinicUsers: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("authService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve registrar usuario com senha hash e documentos normalizados", async () => {
    mockedAuthRepository.findUserByEmail.mockResolvedValue(null);
    mockedAuthRepository.findUserByCpf.mockResolvedValue(null);
    mockedAuthRepository.findBusinessProfileByCnpj.mockResolvedValue(null);
    mockedHash.mockResolvedValue("hashed-password" as never);
    mockedAuthRepository.createUserWithBusinessProfile.mockResolvedValue(
      makeUserRecord({
        businessProfile: {
          businessName: "Bella Clinic",
          cnpj: "11222333000181",
          hasTeam: false,
          usesRooms: false,
        },
      }) as never,
    );

    const result = await authService.register({
      name: "Maria Silva",
      email: "maria@bella.com",
      password: "Senha@123",
      cpf: "123.456.789-09",
      businessName: "Bella Clinic",
      cnpj: "11.222.333/0001-81",
    });

    expect(mockedHash).toHaveBeenCalledWith("Senha@123", 10);
    expect(mockedAuthRepository.createUserWithBusinessProfile).toHaveBeenCalledWith({
      user: {
        name: "Maria Silva",
        email: "maria@bella.com",
        passwordHash: "hashed-password",
        cpf: "12345678909",
      },
      businessProfile: {
        businessName: "Bella Clinic",
        cnpj: "11222333000181",
      },
    });
    expect(result).toMatchObject({
      id: "user-1",
      name: "Maria Silva",
      email: "maria@bella.com",
      cpf: "12345678909",
      businessProfile: {
        businessName: "Bella Clinic",
        cnpj: "11222333000181",
      },
    });
  });

  it("deve rejeitar registro quando email ja existe", async () => {
    mockedAuthRepository.findUserByEmail.mockResolvedValue(makeUserRecord() as never);
    mockedAuthRepository.findUserByCpf.mockResolvedValue(null);
    mockedAuthRepository.findBusinessProfileByCnpj.mockResolvedValue(null);

    await expect(
      authService.register({
        name: "Maria Silva",
        email: "maria@bella.com",
        password: "Senha@123",
        cpf: "123.456.789-09",
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "EMAIL_ALREADY_EXISTS",
    });
  });

  it("deve retornar token no login quando credenciais forem validas", async () => {
    mockedAuthRepository.findUserByEmail.mockResolvedValue(makeUserRecord() as never);
    mockedCompare.mockResolvedValue(true as never);
    mockedSignAccessToken.mockReturnValue("jwt-token");
    mockedSignRefreshToken.mockReturnValue("refresh-token");
    mockedGetTokenExpirationDate.mockReturnValue(new Date("2030-01-01T00:00:00.000Z"));
    mockedHashToken.mockReturnValue("refresh-token-hash");

    const result = await authService.login({
      email: "maria@bella.com",
      password: "Senha@123",
    });

    const issuedSessionId = mockedSignRefreshToken.mock.calls[0]?.[1];

    expect(mockedCompare).toHaveBeenCalledWith("Senha@123", "hashed-password");
    expect(mockedSignRefreshToken).toHaveBeenCalledWith("user-1", expect.any(String));
    expect(mockedSignAccessToken).toHaveBeenCalledWith("user-1", issuedSessionId);
    expect(mockedAuthRepository.createRefreshSession).toHaveBeenCalledWith({
      id: issuedSessionId,
      userId: "user-1",
      tokenHash: "refresh-token-hash",
      expiresAt: new Date("2030-01-01T00:00:00.000Z"),
    });
    expect(result).toMatchObject({
      token: "jwt-token",
      refreshToken: "refresh-token",
      user: {
        id: "user-1",
        email: "maria@bella.com",
      },
    });
  });

  it("deve bloquear login de conta sem senha criada", async () => {
    mockedAuthRepository.findUserByEmail.mockResolvedValue(
      makeUserRecord({
        passwordHash: null,
        cpf: null,
      }) as never,
    );

    await expect(
      authService.login({
        email: "maria@bella.com",
        password: "Senha@123",
      }),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "ACCOUNT_NOT_ACTIVATED",
    });
  });

  it("deve remover refresh token no logout", async () => {
    mockedDecodeAuthToken.mockReturnValue({
      userId: "user-1",
      sessionId: "session-1",
      type: "refresh",
    } as never);
    mockedHashToken.mockReturnValue("refresh-token-hash");
    mockedAuthRepository.findRefreshSession.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
    } as never);
    mockedAuthRepository.deleteRefreshSession.mockResolvedValue({ count: 1 } as never);

    await authService.logout("refresh-token");

    expect(mockedAuthRepository.findRefreshSession).toHaveBeenCalledWith("session-1", "refresh-token-hash");
    expect(mockedAuthRepository.deleteRefreshSession).toHaveBeenCalledWith("session-1");
  });

  it("deve renovar a sessao usando refresh token valido", async () => {
    const expiresAt = new Date(Date.now() + 60_000);

    mockedVerifyRefreshToken.mockReturnValue({
      userId: "user-1",
      sessionId: "session-1",
      type: "refresh",
    } as never);
    mockedHashToken.mockImplementation((token) =>
      token === "current-refresh-token" ? "current-refresh-token-hash" : "next-refresh-token-hash",
    );
    mockedAuthRepository.findRefreshSession.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      expiresAt,
      user: makeUserRecord(),
    } as never);
    mockedSignAccessToken.mockReturnValue("next-access-token");
    mockedSignRefreshToken.mockReturnValue("next-refresh-token");
    mockedGetTokenExpirationDate.mockReturnValue(new Date("2030-01-02T00:00:00.000Z"));

    const result = await authService.refresh({
      refreshToken: "current-refresh-token",
    });

    const nextSessionId = mockedSignRefreshToken.mock.calls[0]?.[1];

    expect(mockedAuthRepository.findRefreshSession).toHaveBeenCalledWith("session-1", "current-refresh-token-hash");
    expect(mockedAuthRepository.rotateRefreshSession).toHaveBeenCalledWith("session-1", {
      id: nextSessionId,
      userId: "user-1",
      tokenHash: "next-refresh-token-hash",
      expiresAt: new Date("2030-01-02T00:00:00.000Z"),
    });
    expect(mockedSignAccessToken).toHaveBeenCalledWith("user-1", nextSessionId);
    expect(result).toMatchObject({
      token: "next-access-token",
      refreshToken: "next-refresh-token",
      user: {
        id: "user-1",
      },
    });
  });

  it("deve validar convite e ativar a conta com senha hash", async () => {
    mockedHashToken.mockReturnValue("invite-hash");
    mockedAuthRepository.findInviteTokenByHash.mockResolvedValue({
      id: "invite-1",
      token: "invite-hash",
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
      createdAt: new Date(),
      userId: "user-2",
      user: {
        id: "user-2",
        name: "Ana Souza",
        email: "ana@bella.com",
        passwordHash: null,
        clinicUsers: [
          {
            clinic: {
              businessProfile: {
                businessName: "Bella Clinic",
              },
            },
          },
        ],
      },
    } as never);
    mockedHash.mockResolvedValue("new-password-hash" as never);
    mockedAuthRepository.activateUserFromInvite.mockResolvedValue(
      makeUserRecord({
        id: "user-2",
        name: "Ana Souza",
        email: "ana@bella.com",
        passwordHash: "new-password-hash",
        cpf: null,
      }) as never,
    );

    const status = await authService.getActivationStatus("raw-token");
    const activation = await authService.activateAccount({
      token: "raw-token",
      password: "Senha@123",
    });

    expect(status).toEqual({
      clinicName: "Bella Clinic",
      email: "ana@bella.com",
      name: "Ana Souza",
    });
    expect(mockedHash).toHaveBeenCalledWith("Senha@123", 10);
    expect(mockedAuthRepository.activateUserFromInvite).toHaveBeenCalledWith({
      inviteTokenId: "invite-1",
      userId: "user-2",
      passwordHash: "new-password-hash",
    });
    expect(activation).toEqual({
      email: "ana@bella.com",
      name: "Ana Souza",
    });
  });
});
