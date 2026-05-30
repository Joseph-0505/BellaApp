import { ClinicUserRole, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { professionalResponseInclude } from "../../shared/mappers/professional-response";

const professionalResponseIncludeWithoutInvites = {
  user: {
    select: {
      passwordHash: true,
    },
  },
  clinicUser: {
    select: {
      user: {
        select: {
          passwordHash: true,
        },
      },
    },
  },
} satisfies Prisma.ProfessionalInclude;

type ListProfessionalsParams = {
  clinicId: string;
  page: number;
  limit: number;
  search?: string;
  status?: boolean;
};

type CountProfessionalsParams = {
  clinicId: string;
  search?: string;
  status?: boolean;
};

function buildProfessionalWhere(
  clinicId: string,
  search?: string,
  status?: boolean,
): Prisma.ProfessionalWhereInput {
  return {
    clinicId,
    ...(typeof status === "boolean" ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { specialty: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : {}),
  };
}

function isInviteTokenTableMissing(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code !== "P2021") {
    return false;
  }

  const table = String(error.meta?.table ?? "").toLowerCase();
  return table.includes("invitetoken");
}

class ProfessionalsRepository {
  async listByUser(params: ListProfessionalsParams) {
    const { clinicId, page, limit, search, status } = params;

    try {
      return await prisma.professional.findMany({
        where: buildProfessionalWhere(clinicId, search, status),
        include: professionalResponseInclude,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (error) {
      if (!isInviteTokenTableMissing(error)) {
        throw error;
      }

      return prisma.professional.findMany({
        where: buildProfessionalWhere(clinicId, search, status),
        include: professionalResponseIncludeWithoutInvites,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      });
    }
  }

  countByUser(params: CountProfessionalsParams) {
    const { clinicId, search, status } = params;

    return prisma.professional.count({
      where: buildProfessionalWhere(clinicId, search, status),
    });
  }

  countAllByClinic(clinicId: string) {
    return prisma.professional.count({
      where: { clinicId },
    });
  }

  async findById(clinicId: string, id: string) {
    try {
      return await prisma.professional.findFirst({
        where: {
          id,
          clinicId,
        },
        include: professionalResponseInclude,
      });
    } catch (error) {
      if (!isInviteTokenTableMissing(error)) {
        throw error;
      }

      return prisma.professional.findFirst({
        where: {
          id,
          clinicId,
        },
        include: professionalResponseIncludeWithoutInvites,
      });
    }
  }

  async create(data: {
    userId: string;
    clinicId: string;
    name: string;
    specialty: string;
    phone: string;
    status: boolean;
    email?: string;
  }) {
    try {
      return await prisma.professional.create({
        data,
        include: professionalResponseInclude,
      });
    } catch (error) {
      if (!isInviteTokenTableMissing(error)) {
        throw error;
      }

      return prisma.professional.create({
        data,
        include: professionalResponseIncludeWithoutInvites,
      });
    }
  }

  createInvitedProfessional(data: {
    clinicId: string;
    email: string;
    invitedByUserId: string;
    name: string;
    phone: string;
    specialty: string;
    status: boolean;
  }) {
    return prisma.$transaction(
      async (transaction: Prisma.TransactionClient) => {
        const clinic = await transaction.clinic.findUniqueOrThrow({
          where: { id: data.clinicId },
          select: { plan: true },
        });

        const user = await transaction.user.create({
          data: {
            name: data.name,
            email: data.email,
            passwordHash: null,
            cpf: null,
            plan: clinic.plan,
          },
        });

        const professional = await transaction.professional.create({
          data: {
            userId: user.id,
            clinicId: data.clinicId,
            name: data.name,
            specialty: data.specialty,
            email: data.email,
            phone: data.phone,
            status: data.status,
          },
        });

        await transaction.clinicUser.create({
          data: {
            clinicId: data.clinicId,
            userId: user.id,
            professionalId: professional.id,
            role: ClinicUserRole.PROFESSIONAL,
          },
        });

        try {
          return await transaction.professional.findUniqueOrThrow({
            where: { id: professional.id },
            include: professionalResponseInclude,
          });
        } catch (error) {
          if (!isInviteTokenTableMissing(error)) {
            throw error;
          }

          return transaction.professional.findUniqueOrThrow({
            where: { id: professional.id },
            include: professionalResponseIncludeWithoutInvites,
          });
        }
      },
    );
  }

  async update(
    id: string,
    data: {
      name: string;
      specialty: string;
      phone: string;
      status: boolean;
      email?: string | null;
    },
  ) {
    try {
      return await prisma.professional.update({
        where: { id },
        data,
        include: professionalResponseInclude,
      });
    } catch (error) {
      if (!isInviteTokenTableMissing(error)) {
        throw error;
      }

      return prisma.professional.update({
        where: { id },
        data,
        include: professionalResponseIncludeWithoutInvites,
      });
    }
  }

  updateWithLinkedUserEmail(data: {
    id: string;
    userId: string;
    email: string;
    name: string;
    specialty: string;
    phone: string;
    status: boolean;
  }) {
    return prisma.$transaction(
      async (transaction: Prisma.TransactionClient) => {
        await transaction.user.update({
          where: { id: data.userId },
          data: { email: data.email },
        });

        try {
          return await transaction.professional.update({
            where: { id: data.id },
            data: {
              name: data.name,
              specialty: data.specialty,
              phone: data.phone,
              status: data.status,
              email: data.email,
            },
            include: professionalResponseInclude,
          });
        } catch (error) {
          if (!isInviteTokenTableMissing(error)) {
            throw error;
          }

          return transaction.professional.update({
            where: { id: data.id },
            data: {
              name: data.name,
              specialty: data.specialty,
              phone: data.phone,
              status: data.status,
              email: data.email,
            },
            include: professionalResponseIncludeWithoutInvites,
          });
        }
      },
    );
  }

  findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
      },
    });
  }

  findClinicSummary(clinicId: string) {
    return prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        businessProfile: {
          select: {
            businessName: true,
          },
        },
      },
    });
  }

  findLinkedUserByProfessionalId(clinicId: string, professionalId: string) {
    return prisma.clinicUser.findFirst({
      where: {
        clinicId,
        professionalId,
      },
      select: {
        userId: true,
        user: {
          select: {
            id: true,
            email: true,
            passwordHash: true,
          },
        },
      },
    });
  }

  delete(id: string) {
    return prisma.professional.delete({
      where: { id },
    });
  }

  countClinicUsersByProfessionalId(professionalId: string) {
    return prisma.clinicUser.count({
      where: {
        professionalId,
      },
    });
  }
}

export const professionalsRepository = new ProfessionalsRepository();

export type { CountProfessionalsParams, ListProfessionalsParams };
