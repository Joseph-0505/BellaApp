jest.mock("./professionals.repository", () => ({
  professionalsRepository: {
    listByUser: jest.fn(),
    countByUser: jest.fn(),
    countAllByClinic: jest.fn(),
    findById: jest.fn(),
    findUserByEmail: jest.fn(),
    findClinicSummary: jest.fn(),
    findLinkedUserByProfessionalId: jest.fn(),
    create: jest.fn(),
    createInvitedProfessional: jest.fn(),
    update: jest.fn(),
    updateWithLinkedUserEmail: jest.fn(),
    delete: jest.fn(),
    countClinicUsersByProfessionalId: jest.fn(),
  },
}));

jest.mock("../auth/account-invite.service", () => ({
  accountInviteService: {
    issueProfessionalInvite: jest.fn(),
  },
}));

jest.mock("../../shared/auth/user-clinic-context", () => ({
  userClinicContextService: {
    getOrThrow: jest.fn(),
  },
  assertClinicAdmin: jest.fn(),
  isIndividualPlan: jest.fn(),
}));

import { professionalsRepository } from "./professionals.repository";
import { professionalsService } from "./professionals.service";
import { accountInviteService } from "../auth/account-invite.service";
import {
  assertClinicAdmin,
  isIndividualPlan,
  userClinicContextService,
} from "../../shared/auth/user-clinic-context";

const mockedProfessionalsRepository = professionalsRepository as jest.Mocked<typeof professionalsRepository>;
const mockedAccountInviteService = accountInviteService as jest.Mocked<typeof accountInviteService>;
const mockedAssertClinicAdmin = assertClinicAdmin as jest.MockedFunction<typeof assertClinicAdmin>;
const mockedIsIndividualPlan = isIndividualPlan as jest.MockedFunction<typeof isIndividualPlan>;
const mockedUserClinicContextService = userClinicContextService as jest.Mocked<typeof userClinicContextService>;

function makeProfessionalRecord(overrides = {}) {
  return {
    id: "professional-1",
    userId: "user-1",
    clinicId: "clinic-1",
    name: "Dra. Ana",
    specialty: "Fisioterapeuta",
    email: "ana@bella.com",
    phone: "(11) 99999-0001",
    status: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    clinicUser: null,
    ...overrides,
  };
}

describe("professionalsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUserClinicContextService.getOrThrow.mockResolvedValue({
      userId: "user-1",
      clinicId: "clinic-1",
      plan: "TEAM",
      role: "ADMIN",
      professionalId: null,
    } as never);
    mockedAssertClinicAdmin.mockImplementation(() => {});
    mockedIsIndividualPlan.mockReturnValue(false);
  });

  it("deve listar profissionais com meta de paginacao", async () => {
    mockedProfessionalsRepository.listByUser.mockResolvedValue([
      makeProfessionalRecord(),
    ] as never);
    mockedProfessionalsRepository.countByUser.mockResolvedValue(1);

    const result = await professionalsService.list("user-1", {
      page: 1,
      limit: 10,
      search: "Ana",
      status: "ativo",
    });

    expect(mockedProfessionalsRepository.listByUser).toHaveBeenCalledWith({
      clinicId: "clinic-1",
      page: 1,
      limit: 10,
      search: "Ana",
      status: true,
    });
    expect(result).toEqual({
      data: [
        {
          id: "professional-1",
          name: "Dra. Ana",
          specialty: "Fisioterapeuta",
          email: "ana@bella.com",
          phone: "(11) 99999-0001",
          status: "ativo",
          initials: "DA",
          tone: "sand",
          accessStatus: "no_access",
          inviteExpiresAt: null,
        },
      ],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });
  });

  it("deve criar profissional com email opcional", async () => {
    mockedProfessionalsRepository.countAllByClinic.mockResolvedValue(1);
    mockedProfessionalsRepository.create.mockResolvedValue(
      makeProfessionalRecord({
        id: "professional-2",
        name: "Dra. Beatriz",
        specialty: "Esteticista",
        email: null,
        phone: "(11) 98888-0002",
      }) as never,
    );

    const result = await professionalsService.create("user-1", {
      name: "Dra. Beatriz",
      specialty: "Esteticista",
      phone: "(11) 98888-0002",
      status: "ativo",
    });

    expect(mockedProfessionalsRepository.create).toHaveBeenCalledWith({
      userId: "user-1",
      clinicId: "clinic-1",
      name: "Dra. Beatriz",
      specialty: "Esteticista",
      phone: "(11) 98888-0002",
      status: true,
    });
    expect(result).toEqual({
      id: "professional-2",
      name: "Dra. Beatriz",
      specialty: "Esteticista",
      email: null,
      phone: "(11) 98888-0002",
      status: "ativo",
      initials: "DB",
      tone: "sage",
      accessStatus: "no_access",
      inviteExpiresAt: null,
    });
  });

  it("deve criar profissional convidado e emitir convite", async () => {
    mockedProfessionalsRepository.countAllByClinic.mockResolvedValue(1);
    mockedProfessionalsRepository.findUserByEmail.mockResolvedValue(null);
    mockedProfessionalsRepository.findClinicSummary.mockResolvedValue({
      businessProfile: {
        businessName: "Bella Clinic",
      },
    } as never);
    mockedProfessionalsRepository.createInvitedProfessional.mockResolvedValue(
      makeProfessionalRecord({
        id: "professional-3",
        userId: "user-2",
        name: "Ana Souza",
        specialty: "A definir",
        phone: "A definir",
        clinicUser: {
          user: {
            passwordHash: null,
            inviteTokens: [
              {
                expiresAt: new Date(Date.now() + 60_000),
              },
            ],
          },
        },
      }) as never,
    );

    const result = await professionalsService.invite("user-1", {
      name: "Ana Souza",
      email: "ana@bella.com",
    });

    expect(mockedProfessionalsRepository.createInvitedProfessional).toHaveBeenCalledWith({
      clinicId: "clinic-1",
      email: "ana@bella.com",
      invitedByUserId: "user-1",
      name: "Ana Souza",
      specialty: "A definir",
      phone: "A definir",
      status: true,
    });
    expect(mockedAccountInviteService.issueProfessionalInvite).toHaveBeenCalledWith({
      clinicName: "Bella Clinic",
      recipientEmail: "ana@bella.com",
      recipientName: "Ana Souza",
      userId: "user-2",
    });
    expect(result.accessStatus).toBe("invite_pending");
  });

  it("deve retornar 404 ao atualizar profissional inexistente", async () => {
    mockedProfessionalsRepository.findById.mockResolvedValue(null);
    mockedProfessionalsRepository.findLinkedUserByProfessionalId.mockResolvedValue(null);

    await expect(
      professionalsService.update("user-1", "professional-1", {
        name: "Dra. Ana",
        specialty: "Fisioterapeuta",
        phone: "(11) 99999-0001",
        email: "ana@bella.com",
        status: "ativo",
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "RESOURCE_NOT_FOUND",
    });

    expect(mockedProfessionalsRepository.update).not.toHaveBeenCalled();
  });
});
