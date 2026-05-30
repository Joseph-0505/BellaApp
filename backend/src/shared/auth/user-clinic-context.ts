import { ClinicPlan, ClinicUserRole, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../errors/app-error";

type PrismaExecutor = Prisma.TransactionClient | typeof prisma;

export type UserClinicContext = {
  userId: string;
  clinicId: string;
  plan: ClinicPlan;
  trialEndsAt: Date | null;
  role: ClinicUserRole;
  professionalId: string | null;
};

function accessDeniedError(
  message = "Usuário sem acesso à clínica atual.",
): AppError {
  return new AppError(403, "CLINIC_ACCESS_DENIED", message);
}

function adminOnlyError(
  message = "Ação permitida apenas para administradores.",
): AppError {
  return new AppError(403, "FORBIDDEN", message);
}

function professionalLinkError(): AppError {
  return new AppError(
    403,
    "PROFESSIONAL_CONTEXT_REQUIRED",
    "O usuário atual não está vinculado a um profissional.",
  );
}

export class UserClinicContextService {
  async getOrThrow(
    userId: string,
    db: PrismaExecutor = prisma,
  ): Promise<UserClinicContext> {
    const membership = await db.clinicUser.findFirst({
      where: { userId },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        clinicId: true,
        role: true,
        professionalId: true,
        clinic: {
          select: {
            plan: true,
            trialEndsAt: true,
          },
        },
      },
    });

    if (!membership) {
      throw accessDeniedError();
    }

    return {
      userId,
      clinicId: membership.clinicId,
      plan: membership.clinic.plan,
      trialEndsAt: membership.clinic.trialEndsAt,
      role: membership.role,
      professionalId: membership.professionalId ?? null,
    };
  }
}

export function assertClinicAdmin(
  context: UserClinicContext,
  message?: string,
): void {
  if (context.role !== ClinicUserRole.ADMIN) {
    throw adminOnlyError(message);
  }
}

export function getRequiredProfessionalId(context: UserClinicContext): string {
  if (!context.professionalId) {
    throw professionalLinkError();
  }

  return context.professionalId;
}

export function isIndividualPlan(context: UserClinicContext): boolean {
  return context.plan === ClinicPlan.INDIVIDUAL;
}

export function isTrialPlan(context: UserClinicContext): boolean {
  return context.plan === ClinicPlan.TRIAL;
}

export function isTrialActive(
  context: Pick<UserClinicContext, "plan" | "trialEndsAt">,
): boolean {
  if (context.plan !== ClinicPlan.TRIAL) {
    return true;
  }

  if (!context.trialEndsAt) {
    return false;
  }

  return Date.now() <= context.trialEndsAt.getTime();
}

export function resolveScopedProfessionalId(
  context: UserClinicContext,
  requestedProfessionalId?: string | null,
): string | undefined {
  if (context.role === ClinicUserRole.ADMIN) {
    return requestedProfessionalId ?? undefined;
  }

  const professionalId = getRequiredProfessionalId(context);

  if (requestedProfessionalId && requestedProfessionalId !== professionalId) {
    throw accessDeniedError("Você só pode acessar sua própria agenda.");
  }

  return professionalId;
}

export function assertProfessionalOwnership(
  context: UserClinicContext,
  professionalId?: string | null,
  message = "Você só pode acessar seus próprios registros.",
): void {
  if (context.role === ClinicUserRole.ADMIN) {
    return;
  }

  const currentProfessionalId = getRequiredProfessionalId(context);

  if (professionalId !== currentProfessionalId) {
    throw accessDeniedError(message);
  }
}

export const userClinicContextService = new UserClinicContextService();

export type { PrismaExecutor };
