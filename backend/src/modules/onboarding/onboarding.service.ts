import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import {
  assertClinicAdmin,
  userClinicContextService,
} from "../../shared/auth/user-clinic-context";
import { AppError } from "../../shared/errors/app-error";
import { usersRepository } from "../users/users.repository";
import {
  CompleteOnboardingRequestDto,
  CompleteOnboardingResponseDto,
  OnboardingStatusResponseDto,
} from "./onboarding.dtos";

type OnboardingTransaction = Prisma.TransactionClient | typeof prisma;
type OnboardingUser = NonNullable<
  Awaited<ReturnType<typeof usersRepository.findById>>
>;

const DEFAULT_SCHEDULE = {
  mondayToFriday: { start: "08:00", end: "18:00" },
  saturday: { start: "08:00", end: "12:00" },
  sunday: { closed: true as const },
};

class OnboardingService {
  private async buildStatus(
    userId: string,
    transaction: OnboardingTransaction,
  ): Promise<OnboardingStatusResponseDto> {
    const context = await userClinicContextService.getOrThrow(
      userId,
      transaction,
    );
    const [businessProfile, servicesCount, professionalsCount, roomsCount] =
      await Promise.all([
        transaction.businessProfile.findFirst({
          where: { clinicId: context.clinicId },
        }),
        transaction.service.count({ where: { clinicId: context.clinicId } }),
        transaction.professional.count({
          where: { clinicId: context.clinicId },
        }),
        transaction.room.count({ where: { clinicId: context.clinicId } }),
      ]);

    const completed = Boolean(businessProfile?.onboardingCompletedAt);

    return {
      completed,
      businessName: businessProfile?.businessName || "",
      hasTeam: businessProfile?.hasTeam ?? false,
      usesRooms: businessProfile?.usesRooms ?? false,
      servicesCount,
      professionalsCount,
      roomsCount,
      defaultSchedule: DEFAULT_SCHEDULE,
    };
  }

  private async getUserOrThrow(userId: string): Promise<OnboardingUser> {
    const user = await usersRepository.findById(userId);

    if (!user) {
      throw new AppError(404, "RESOURCE_NOT_FOUND", "UsuÃ¡rio nÃ£o encontrado.");
    }

    return user;
  }

  private buildBusinessProfileData(
    user: OnboardingUser,
    input: CompleteOnboardingRequestDto,
  ) {
    return {
      businessName: input.businessName,
      cnpj: user.businessProfile?.cnpj ?? null,
      hasTeam: user.businessProfile?.hasTeam ?? false,
      usesRooms: user.businessProfile?.usesRooms ?? false,
      onboardingCompletedAt: new Date(),
    };
  }

  private async upsertBusinessProfile(args: {
    clinicId: string;
    userId: string;
    user: OnboardingUser;
    input: CompleteOnboardingRequestDto;
    transaction: Prisma.TransactionClient;
  }): Promise<void> {
    const { clinicId, userId, user, input, transaction } = args;
    const businessProfileData = this.buildBusinessProfileData(user, input);

    if (user.businessProfile) {
      await transaction.businessProfile.update({
        where: { userId },
        data: {
          ...businessProfileData,
          clinicId,
        },
      });
      return;
    }

    await transaction.businessProfile.create({
      data: {
        userId,
        clinicId,
        ...businessProfileData,
      },
    });
  }

  private async createDefaultProfessionalIfNeeded(args: {
    clinicId: string;
    userId: string;
    user: OnboardingUser;
    transaction: Prisma.TransactionClient;
  }): Promise<boolean> {
    const { clinicId, userId, user, transaction } = args;
    const professionalsCount = await transaction.professional.count({
      where: { clinicId },
    });

    if (professionalsCount > 0) {
      return false;
    }

    await transaction.professional.create({
      data: {
        userId,
        clinicId,
        name: user.name,
        specialty: "Atendimento geral",
        phone: "A definir",
        status: true,
        ...(user.email ? { email: user.email } : {}),
      },
    });

    return true;
  }

  private async completeTransaction(
    clinicId: string,
    userId: string,
    user: OnboardingUser,
    input: CompleteOnboardingRequestDto,
    transaction: Prisma.TransactionClient,
  ): Promise<CompleteOnboardingResponseDto> {
    await this.upsertBusinessProfile({
      clinicId,
      userId,
      user,
      input,
      transaction,
    });

    const createdProfessional = await this.createDefaultProfessionalIfNeeded({
      clinicId,
      userId,
      user,
      transaction,
    });
    const status = await this.buildStatus(userId, transaction);

    return {
      ...status,
      created: {
        professional: createdProfessional,
        services: [],
        rooms: [],
      },
    };
  }

  async getStatus(userId: string): Promise<OnboardingStatusResponseDto> {
    return this.buildStatus(userId, prisma);
  }

  async complete(
    userId: string,
    input: CompleteOnboardingRequestDto,
  ): Promise<CompleteOnboardingResponseDto> {
    const context = await userClinicContextService.getOrThrow(userId);
    assertClinicAdmin(context);
    const user = await this.getUserOrThrow(userId);

    return prisma.$transaction((transaction) =>
      this.completeTransaction(
        context.clinicId,
        userId,
        user,
        input,
        transaction,
      ),
    );
  }
}

export const onboardingService = new OnboardingService();
