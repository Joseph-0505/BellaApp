import { ClinicUserRole, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { userResponseInclude } from "../../shared/mappers/user-response";

const TRIAL_DURATION_DAYS = 7;

function getTrialEndDate(now = new Date()): Date {
  return new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
}

class AuthRepository {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: userResponseInclude,
    });
  }

  findUserByCpf(cpf: string) {
    return prisma.user.findUnique({
      where: { cpf },
      include: userResponseInclude,
    });
  }

  findBusinessProfileByCnpj(cnpj: string) {
    return prisma.businessProfile.findUnique({
      where: { cnpj },
    });
  }

  deleteRefreshSession(sessionId: string) {
    return prisma.refreshToken.deleteMany({
      where: { id: sessionId },
    });
  }

  findRefreshSession(sessionId: string, tokenHash: string) {
    return prisma.refreshToken.findFirst({
      where: {
        id: sessionId,
        token: tokenHash,
      },
      include: {
        user: {
          include: userResponseInclude,
        },
      },
    });
  }

  createRefreshSession(data: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return prisma.refreshToken.create({
      data: {
        id: data.id,
        userId: data.userId,
        token: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    });
  }

  rotateRefreshSession(
    currentSessionId: string,
    nextSession: {
      id: string;
      userId: string;
      tokenHash: string;
      expiresAt: Date;
    },
  ) {
    return prisma.$transaction(
      async (transaction: Prisma.TransactionClient) => {
        await transaction.refreshToken.deleteMany({
          where: { id: currentSessionId },
        });

        return transaction.refreshToken.create({
          data: {
            id: nextSession.id,
            userId: nextSession.userId,
            token: nextSession.tokenHash,
            expiresAt: nextSession.expiresAt,
          },
        });
      },
    );
  }

  replaceInviteToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return prisma.$transaction(
      async (transaction: Prisma.TransactionClient) => {
        const now = new Date();

        await transaction.inviteToken.updateMany({
          where: {
            userId: data.userId,
            usedAt: null,
          },
          data: {
            usedAt: now,
          },
        });

        return transaction.inviteToken.create({
          data: {
            userId: data.userId,
            token: data.tokenHash,
            expiresAt: data.expiresAt,
          },
        });
      },
    );
  }

  findInviteTokenByHash(tokenHash: string) {
    return prisma.inviteToken.findUnique({
      where: {
        token: tokenHash,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            clinicUsers: {
              take: 1,
              orderBy: {
                createdAt: "asc",
              },
              select: {
                clinic: {
                  select: {
                    businessProfile: {
                      select: {
                        businessName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  activateUserFromInvite(data: {
    inviteTokenId: string;
    userId: string;
    passwordHash: string;
  }) {
    return prisma.$transaction(
      async (transaction: Prisma.TransactionClient) => {
        const now = new Date();

        await transaction.user.update({
          where: { id: data.userId },
          data: {
            passwordHash: data.passwordHash,
          },
        });

        await transaction.inviteToken.update({
          where: { id: data.inviteTokenId },
          data: {
            usedAt: now,
          },
        });

        await transaction.inviteToken.updateMany({
          where: {
            userId: data.userId,
            usedAt: null,
          },
          data: {
            usedAt: now,
          },
        });

        return transaction.user.findUniqueOrThrow({
          where: { id: data.userId },
          include: userResponseInclude,
        });
      },
    );
  }

  createUserWithBusinessProfile(data: {
    user: {
      name: string;
      email: string;
      passwordHash: string;
      cpf: string;
    };
    businessProfile?: {
      businessName: string;
      cnpj: string | null;
    };
  }) {
    return prisma.$transaction(
      async (transaction: Prisma.TransactionClient) => {
        const user = await transaction.user.create({
          data: {
            ...data.user,
            plan: "TRIAL",
          },
        });

        const clinic = await transaction.clinic.create({
          data: {
            plan: "TRIAL",
            trialEndsAt: getTrialEndDate(),
          },
        });

        const professional = await transaction.professional.create({
          data: {
            userId: user.id,
            clinicId: clinic.id,
            name: user.name,
            specialty: "Atendimento geral",
            email: user.email,
            phone: "A definir",
            status: true,
          },
        });

        await transaction.clinicUser.create({
          data: {
            clinicId: clinic.id,
            userId: user.id,
            professionalId: professional.id,
            role: ClinicUserRole.ADMIN,
          },
        });

        if (data.businessProfile) {
          await transaction.businessProfile.create({
            data: {
              userId: user.id,
              clinicId: clinic.id,
              businessName: data.businessProfile.businessName,
              cnpj: data.businessProfile.cnpj,
            },
          });
        }

        return transaction.user.findUniqueOrThrow({
          where: { id: user.id },
          include: userResponseInclude,
        });
      },
    );
  }
}

export const authRepository = new AuthRepository();
