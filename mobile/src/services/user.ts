import type { Nullable, UserProfile } from "../types/auth";
import { apiGet, apiPut, updateSessionUser, unwrapData } from "./api";

const USERS_BASE_PATH = "/api/v1/users";

interface ApiBusinessProfile {
  businessName?: string | null;
  cnpj?: string | null;
  hasTeam?: boolean | null;
  usesRooms?: boolean | null;
}

interface ApiClinic {
  id: string;
  plan?: "TRIAL" | "INDIVIDUAL" | "TEAM" | null;
  trialEndsAt?: string | null;
}

interface ApiMembership {
  role?: "ADMIN" | "PROFESSIONAL" | null;
  professionalId?: string | null;
}

interface ApiProfessionalSummary {
  id: string;
  name?: string | null;
  specialty?: string | null;
}

interface ApiPermissions {
  manageProfessionals?: boolean | null;
  viewAllAgenda?: boolean | null;
  viewAllCash?: boolean | null;
}

interface ApiUser {
  id: string;
  name?: string | null;
  email?: string | null;
  cpf?: string | null;
  businessProfile?: Nullable<ApiBusinessProfile>;
  clinic?: Nullable<ApiClinic>;
  membership?: Nullable<ApiMembership>;
  professional?: Nullable<ApiProfessionalSummary>;
  permissions?: Nullable<ApiPermissions>;
}

interface UpdateCurrentUserPayload {
  name: string;
  cpf: string;
  password: string;
  businessName?: string;
  cnpj?: string;
}

function toUserViewModel(user: Nullable<ApiUser>): Nullable<UserProfile> {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name || "",
    email: user.email || "",
    cpf: user.cpf || "",
    businessProfile: user.businessProfile
      ? {
          businessName: user.businessProfile.businessName || "",
          cnpj: user.businessProfile.cnpj || "",
          hasTeam: Boolean(user.businessProfile.hasTeam),
          usesRooms: Boolean(user.businessProfile.usesRooms),
        }
      : null,
    clinic: user.clinic
      ? {
          id: user.clinic.id,
          plan:
            user.clinic.plan === "TEAM"
              ? "TEAM"
              : user.clinic.plan === "TRIAL"
                ? "TRIAL"
                : "INDIVIDUAL",
          trialEndsAt: user.clinic.trialEndsAt || null,
        }
      : null,
    membership: user.membership
      ? {
          role: user.membership.role === "PROFESSIONAL" ? "PROFESSIONAL" : "ADMIN",
          professionalId: user.membership.professionalId || null,
        }
      : null,
    professional: user.professional
      ? {
          id: user.professional.id,
          name: user.professional.name || "",
          specialty: user.professional.specialty || "",
        }
      : null,
    permissions: {
      manageProfessionals: Boolean(user.permissions?.manageProfessionals),
      viewAllAgenda: Boolean(user.permissions?.viewAllAgenda),
      viewAllCash: Boolean(user.permissions?.viewAllCash),
    },
  };
}

export async function getCurrentUserProfile(): Promise<Nullable<UserProfile>> {
  const response = await apiGet(`${USERS_BASE_PATH}/me`);
  return toUserViewModel(unwrapData<ApiUser>(response));
}

export async function updateCurrentUserProfile(
  payload: UpdateCurrentUserPayload,
): Promise<Nullable<UserProfile>> {
  const response = await apiPut(`${USERS_BASE_PATH}/me`, payload);
  const user = toUserViewModel(unwrapData<ApiUser>(response));

  if (user) {
    updateSessionUser(user);
  }

  return user;
}
