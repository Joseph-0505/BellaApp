const mockPrisma = {
  businessProfile: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  professional: {
    count: jest.fn(),
    create: jest.fn(),
  },
  room: {
    count: jest.fn(),
  },
  service: {
    count: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockUsersRepository = {
  findById: jest.fn(),
};

const mockUserClinicContextService = {
  getOrThrow: jest.fn(),
};

const mockAssertClinicAdmin = jest.fn();

jest.mock("../../lib/prisma", () => ({
  prisma: mockPrisma,
}));

jest.mock("../users/users.repository", () => ({
  usersRepository: mockUsersRepository,
}));

jest.mock("../../shared/auth/user-clinic-context", () => ({
  assertClinicAdmin: (...args: unknown[]) => mockAssertClinicAdmin(...args),
  userClinicContextService: mockUserClinicContextService,
}));

import { prisma } from "../../lib/prisma";
import { usersRepository } from "../users/users.repository";
import { onboardingService } from "./onboarding.service";

const mockedPrisma = prisma as unknown as typeof mockPrisma;
const mockedUsersRepository = usersRepository as jest.Mocked<typeof usersRepository>;
const mockedUserClinicContextService = mockUserClinicContextService as jest.Mocked<
  typeof mockUserClinicContextService
>;
const mockedAssertClinicAdmin = mockAssertClinicAdmin as jest.MockedFunction<typeof mockAssertClinicAdmin>;

function makeBusinessProfile(
  overrides: Partial<{
    businessName: string;
    cnpj: string | null;
    hasTeam: boolean;
    usesRooms: boolean;
    onboardingCompletedAt: Date | null;
  }> = {},
) {
  return {
    id: "business-1",
    userId: "user-1",
    clinicId: "clinic-1",
    businessName: "Bella Clinic",
    cnpj: null,
    hasTeam: false,
    usesRooms: false,
    onboardingCompletedAt: null,
    createdAt: new Date("2026-04-12T10:00:00.000Z"),
    updatedAt: new Date("2026-04-12T10:00:00.000Z"),
    ...overrides,
  };
}

function makeUser(
  overrides: Partial<{
    id: string;
    name: string;
    email: string | null;
    businessProfile: ReturnType<typeof makeBusinessProfile> | null;
  }> = {},
) {
  return {
    id: "user-1",
    name: "Maria Silva",
    email: "maria@bella.com",
    cpf: "12345678909",
    passwordHash: "hashed-password",
    businessProfile: null,
    clinicUsers: [],
    createdAt: new Date("2026-04-12T10:00:00.000Z"),
    updatedAt: new Date("2026-04-12T10:00:00.000Z"),
    ...overrides,
  };
}

describe("onboardingService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAssertClinicAdmin.mockReturnValue(undefined);
    mockedUserClinicContextService.getOrThrow.mockResolvedValue({
      userId: "user-1",
      clinicId: "clinic-1",
      plan: "INDIVIDUAL",
      role: "ADMIN",
      professionalId: "professional-1",
    } as never);
    (mockedPrisma.$transaction as jest.Mock).mockImplementation(
      async (callback: (transaction: unknown) => unknown) => callback(mockedPrisma),
    );
  });

  it("deve retornar o status inicial do onboarding", async () => {
    mockedPrisma.businessProfile.findFirst.mockResolvedValue(null as never);
    mockedPrisma.service.count.mockResolvedValue(0 as never);
    mockedPrisma.professional.count.mockResolvedValue(1 as never);
    mockedPrisma.room.count.mockResolvedValue(0 as never);

    const result = await onboardingService.getStatus("user-1");

    expect(mockedUserClinicContextService.getOrThrow).toHaveBeenCalledWith("user-1", mockedPrisma);
    expect(mockedPrisma.businessProfile.findFirst).toHaveBeenCalledWith({
      where: { clinicId: "clinic-1" },
    });
    expect(result).toEqual({
      completed: false,
      businessName: "",
      hasTeam: false,
      usesRooms: false,
      servicesCount: 0,
      professionalsCount: 1,
      roomsCount: 0,
      defaultSchedule: {
        mondayToFriday: { start: "08:00", end: "18:00" },
        saturday: { start: "08:00", end: "12:00" },
        sunday: { closed: true },
      },
    });
  });

  it("deve retornar 404 ao concluir onboarding para usuario inexistente", async () => {
    mockedUsersRepository.findById.mockResolvedValue(null);

    await expect(
      onboardingService.complete("missing-user", {
        businessName: "Bella Clinic",
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "RESOURCE_NOT_FOUND",
    });

    expect(mockedPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("deve reaproveitar business profile existente sem duplicar profissional", async () => {
    mockedUsersRepository.findById.mockResolvedValue(
      makeUser({
        businessProfile: makeBusinessProfile({
          businessName: "Bella Clinic",
          cnpj: "11222333000181",
          hasTeam: true,
          usesRooms: true,
        }),
      }) as never,
    );
    mockedPrisma.professional.count.mockResolvedValueOnce(1 as never).mockResolvedValueOnce(1 as never);
    mockedPrisma.businessProfile.findFirst.mockResolvedValue(
      makeBusinessProfile({
        businessName: "Bella Prime",
        cnpj: "11222333000181",
        hasTeam: true,
        usesRooms: true,
        onboardingCompletedAt: new Date("2026-04-12T12:00:00.000Z"),
      }) as never,
    );
    mockedPrisma.service.count.mockResolvedValue(0 as never);
    mockedPrisma.room.count.mockResolvedValue(0 as never);

    const result = await onboardingService.complete("user-1", {
      businessName: "Bella Prime",
    });

    expect(mockedPrisma.businessProfile.update).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      data: {
        businessName: "Bella Prime",
        cnpj: "11222333000181",
        hasTeam: true,
        usesRooms: true,
        onboardingCompletedAt: expect.any(Date),
        clinicId: "clinic-1",
      },
    });
    expect(mockedPrisma.professional.create).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      completed: true,
      businessName: "Bella Prime",
      hasTeam: true,
      usesRooms: true,
      servicesCount: 0,
      professionalsCount: 1,
      roomsCount: 0,
      created: {
        professional: false,
        services: [],
        rooms: [],
      },
    });
  });

  it("deve criar business profile e profissional inicial quando necessario", async () => {
    mockedUsersRepository.findById.mockResolvedValue(makeUser() as never);
    mockedPrisma.professional.count.mockResolvedValueOnce(0 as never).mockResolvedValueOnce(1 as never);
    mockedPrisma.businessProfile.findFirst.mockResolvedValue(
      makeBusinessProfile({
        businessName: "Bella Clinic",
        onboardingCompletedAt: new Date("2026-04-12T12:00:00.000Z"),
      }) as never,
    );
    mockedPrisma.service.count.mockResolvedValue(0 as never);
    mockedPrisma.room.count.mockResolvedValue(0 as never);

    const result = await onboardingService.complete("user-1", {
      businessName: "Bella Clinic",
    });

    expect(mockedPrisma.businessProfile.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        clinicId: "clinic-1",
        businessName: "Bella Clinic",
        cnpj: null,
        hasTeam: false,
        usesRooms: false,
        onboardingCompletedAt: expect.any(Date),
      },
    });
    expect(mockedPrisma.professional.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        clinicId: "clinic-1",
        name: "Maria Silva",
        specialty: "Atendimento geral",
        phone: "A definir",
        status: true,
        email: "maria@bella.com",
      },
    });
    expect(result).toMatchObject({
      completed: true,
      businessName: "Bella Clinic",
      hasTeam: false,
      usesRooms: false,
      servicesCount: 0,
      professionalsCount: 1,
      roomsCount: 0,
      created: {
        professional: true,
        services: [],
        rooms: [],
      },
    });
  });
});
