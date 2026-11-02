import { ClinicUserRole, Prisma } from "@prisma/client";
import { getProfileImageUrl } from "../uploads/profile-image";

export const userResponseInclude = {
  businessProfile: true,
  clinicUsers: {
    take: 1,
    orderBy: {
      createdAt: "asc",
    },
    include: {
      clinic: {
        select: {
          plan: true,
          trialEndsAt: true,
        },
      },
      professional: {
        select: {
          id: true,
          name: true,
          specialty: true,
        },
      },
    },
  },
} satisfies Prisma.UserInclude;

type UserWithContext = Prisma.UserGetPayload<{
  include: typeof userResponseInclude;
}>;

export type UserResponse = {
  id: string;
  name: string;
  email: string;
  cpf: string;
  avatarUrl?: string | null;
  businessProfile: {
    businessName: string;
    cnpj: string | null;
    hasTeam: boolean;
    usesRooms: boolean;
  } | null;
  clinic: {
    id: string;
    plan: string;
    trialEndsAt: string | null;
  } | null;
  membership: {
    role: string;
    professionalId: string | null;
  } | null;
  professional: {
    id: string;
    name: string;
    specialty: string;
  } | null;
  permissions: {
    manageProfessionals: boolean;
    viewAllAgenda: boolean;
    viewAllCash: boolean;
  };
};

// Remove detalhes internos do usuário e mantém apenas o necessário para a resposta pública.
export function toUserResponse(user: UserWithContext): UserResponse {
  const membership = user.clinicUsers?.[0] ?? null;
  const isAdmin = membership?.role === ClinicUserRole.ADMIN;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    cpf: user.cpf ?? "",
    avatarUrl: getProfileImageUrl(user.avatarFileName),
    businessProfile: user.businessProfile
      ? {
          businessName: user.businessProfile.businessName,
          cnpj: user.businessProfile.cnpj ?? null,
          hasTeam: user.businessProfile.hasTeam,
          usesRooms: user.businessProfile.usesRooms,
        }
      : null,
    clinic: membership
      ? {
          id: membership.clinicId,
          plan: membership.clinic.plan,
          trialEndsAt: membership.clinic.trialEndsAt
            ? membership.clinic.trialEndsAt.toISOString()
            : null,
        }
      : null,
    membership: membership
      ? {
          role: membership.role,
          professionalId: membership.professionalId ?? null,
        }
      : null,
    professional: membership?.professional
      ? {
          id: membership.professional.id,
          name: membership.professional.name,
          specialty: membership.professional.specialty,
        }
      : null,
    permissions: {
      manageProfessionals: isAdmin,
      viewAllAgenda: isAdmin,
      viewAllCash: isAdmin,
    },
  };
}
