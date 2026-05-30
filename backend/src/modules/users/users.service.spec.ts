jest.mock("bcrypt", () => ({
  __esModule: true,
  default: {
    hash: jest.fn(),
  },
}));

jest.mock("./users.repository", () => ({
  usersRepository: {
    findById: jest.fn(),
    findByCpf: jest.fn(),
    findBusinessProfileByCnpj: jest.fn(),
    updateCurrentUser: jest.fn(),
  },
}));

import bcrypt from "bcrypt";
import { usersRepository } from "./users.repository";
import { usersService } from "./users.service";

const mockedHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;
const mockedUsersRepository = usersRepository as jest.Mocked<typeof usersRepository>;

describe("usersService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve retornar o usuário autenticado quando encontrado", async () => {
    mockedUsersRepository.findById.mockResolvedValue({
      id: "user-1",
      name: "Maria Silva",
      email: "maria@bella.com",
      cpf: "12345678909",
      passwordHash: "hashed-password",
      businessProfile: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const result = await usersService.getCurrentUser("user-1");

    expect(mockedUsersRepository.findById).toHaveBeenCalledWith("user-1");
    expect(result).toEqual({
      id: "user-1",
      name: "Maria Silva",
      email: "maria@bella.com",
      cpf: "12345678909",
      businessProfile: null,
    });
  });

  it("deve retornar 404 quando o usuário autenticado não existir", async () => {
    mockedUsersRepository.findById.mockResolvedValue(null);

    await expect(usersService.getCurrentUser("user-1")).rejects.toMatchObject({
      statusCode: 404,
      code: "RESOURCE_NOT_FOUND",
    });
  });

  it("deve atualizar usuário normalizando CPF e CNPJ", async () => {
    mockedUsersRepository.findById.mockResolvedValue({
      id: "user-1",
      name: "Maria Silva",
      email: "maria@bella.com",
      cpf: "98765432100",
      passwordHash: "hashed-password",
      businessProfile: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    mockedUsersRepository.findByCpf.mockResolvedValue(null);
    mockedUsersRepository.findBusinessProfileByCnpj.mockResolvedValue(null);
    mockedHash.mockResolvedValue("new-hash" as never);
    mockedUsersRepository.updateCurrentUser.mockResolvedValue({
      id: "user-1",
      name: "Maria Atualizada",
      email: "maria@bella.com",
      cpf: "12345678909",
      passwordHash: "new-hash",
      businessProfile: {
        id: "business-1",
        userId: "user-1",
        businessName: "Bella Clinic",
        cnpj: "11222333000181",
        hasTeam: false,
        usesRooms: false,
        onboardingCompletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const result = await usersService.updateCurrentUser("user-1", {
      name: "Maria Atualizada",
      cpf: "123.456.789-09",
      password: "Senha@123",
      businessName: "Bella Clinic",
      cnpj: "11.222.333/0001-81",
    });

    expect(mockedUsersRepository.findByCpf).toHaveBeenCalledWith("12345678909");
    expect(mockedUsersRepository.findBusinessProfileByCnpj).toHaveBeenCalledWith("11222333000181");
    expect(mockedHash).toHaveBeenCalledWith("Senha@123", 10);
    expect(mockedUsersRepository.updateCurrentUser).toHaveBeenCalledWith({
      userId: "user-1",
      name: "Maria Atualizada",
      cpf: "12345678909",
      passwordHash: "new-hash",
      businessProfile: {
        businessName: "Bella Clinic",
        cnpj: "11222333000181",
      },
    });
    expect(result).toEqual({
      id: "user-1",
      name: "Maria Atualizada",
      email: "maria@bella.com",
      cpf: "12345678909",
      businessProfile: {
        businessName: "Bella Clinic",
        cnpj: "11222333000181",
      },
    });
  });

  it("deve bloquear atualização quando CPF pertencer a outro usuário", async () => {
    mockedUsersRepository.findById.mockResolvedValue({
      id: "user-1",
      cpf: "98765432100",
    } as never);
    mockedUsersRepository.findByCpf.mockResolvedValue({
      id: "user-2",
    } as never);

    await expect(
      usersService.updateCurrentUser("user-1", {
        name: "Maria Silva",
        cpf: "123.456.789-09",
        password: "Senha@123",
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "CPF_ALREADY_EXISTS",
    });

    expect(mockedUsersRepository.findBusinessProfileByCnpj).not.toHaveBeenCalled();
    expect(mockedUsersRepository.updateCurrentUser).not.toHaveBeenCalled();
  });

  it("deve bloquear atualização quando CNPJ pertencer a outro usuário", async () => {
    mockedUsersRepository.findById.mockResolvedValue({
      id: "user-1",
      cpf: "12345678909",
      businessProfile: null,
    } as never);
    mockedUsersRepository.findBusinessProfileByCnpj.mockResolvedValue({
      userId: "user-2",
    } as never);

    await expect(
      usersService.updateCurrentUser("user-1", {
        name: "Maria Silva",
        cpf: "123.456.789-09",
        password: "Senha@123",
        businessName: "Bella Clinic",
        cnpj: "11.222.333/0001-81",
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "CNPJ_ALREADY_EXISTS",
    });

    expect(mockedHash).not.toHaveBeenCalled();
    expect(mockedUsersRepository.updateCurrentUser).not.toHaveBeenCalled();
  });
});
