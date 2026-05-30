import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { userResponseInclude } from "../../shared/mappers/user-response";

class UsersRepository {
  findById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: userResponseInclude,
    });
  }

  findByCpf(cpf: string) {
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

  updateCurrentUser(data: {
    userId: string;
    name: string;
    cpf: string;
    passwordHash: string;
    businessProfile?: {
      businessName: string;
      cnpj: string | null;
    };
  }) {
    return prisma.$transaction(
      async (transaction: Prisma.TransactionClient) => {
        await transaction.user.update({
          where: { id: data.userId },
          data: {
            name: data.name,
            cpf: data.cpf,
            passwordHash: data.passwordHash,
          },
        });

        if (data.businessProfile) {
          const businessProfileData = {
            businessName: data.businessProfile.businessName,
            cnpj: data.businessProfile.cnpj,
          };
          const clinicMembership = await transaction.clinicUser.findFirst({
            where: {
              userId: data.userId,
            },
            select: {
              clinicId: true,
            },
          });

          const existingBusinessProfile =
            await transaction.businessProfile.findUnique({
              where: { userId: data.userId },
            });

          if (existingBusinessProfile) {
            await transaction.businessProfile.update({
              where: { userId: data.userId },
              data: {
                ...businessProfileData,
                ...(clinicMembership?.clinicId
                  ? { clinicId: clinicMembership.clinicId }
                  : {}),
              },
            });
          } else {
            await transaction.businessProfile.create({
              data: {
                userId: data.userId,
                ...(clinicMembership?.clinicId
                  ? { clinicId: clinicMembership.clinicId }
                  : {}),
                ...businessProfileData,
              },
            });
          }
        }

        return transaction.user.findUniqueOrThrow({
          where: { id: data.userId },
          include: userResponseInclude,
        });
      },
    );
  }
}

export const usersRepository = new UsersRepository();
