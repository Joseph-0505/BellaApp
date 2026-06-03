import { normalizeCnpj, normalizeCpf } from "../utils/formatters";
import type { UserProfile } from "../types/entities";
import type { UpdateCurrentUserProfileInput } from "../types/profile";
import { apiGet, apiPut, updateSessionUser } from "./api";

const USERS_BASE_PATH = "/api/v1/users";

interface ApiBusinessProfile {
  businessName?: string | null;
  cnpj?: string | null;
  hasTeam?: boolean | null;
  usesRooms?: boolean | null;
}

interface ApiClinic {
  id: ID;
  plan?: "TRIAL" | "INDIVIDUAL" | "TEAM" | null;
  trialEndsAt?: string | null;
}

interface ApiMembership {
  role?: "ADMIN" | "PROFESSIONAL" | null;
  professionalId?: ID | null;
}

interface ApiProfessionalSummary {
  id: ID;
  name?: string | null;
  specialty?: string | null;
}

interface ApiPermissions {
  manageProfessionals?: boolean | null;
  viewAllAgenda?: boolean | null;
  viewAllCash?: boolean | null;
}

interface ApiUser {
  id: ID;
  name?: string | null;
  email?: string | null;
  cpf?: string | null;
  businessProfile?: Nullable<ApiBusinessProfile>;
  clinic?: Nullable<ApiClinic>;
  membership?: Nullable<ApiMembership>;
  professional?: Nullable<ApiProfessionalSummary>;
  permissions?: Nullable<ApiPermissions>;
}

interface ApiEnvelope {
  data?: ApiUser;
}

interface UserPayload {
  name: string;
  cpf: string;
  password: string;
  businessName?: string;
  cnpj?: string;
}

type UserResponse = Nullable<ApiUser | ApiEnvelope>;

function unwrapUserResponse(response: UserResponse): Nullable<ApiUser> {
  if (!response) {
    return null;
  }

  if ("id" in response) {
    return response;
  }

  if ("data" in response) {
    return response.data || null;
  }

  return null;
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
          role:
            user.membership.role === "PROFESSIONAL" ? "PROFESSIONAL" : "ADMIN",
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

function toUserPayload(input: UpdateCurrentUserProfileInput): UserPayload {
  const cpf = normalizeCpf(input.cpf);
  const cnpj = normalizeCnpj(input.cnpj);
  const businessName = String(input.businessName || "").trim();

  return {
    name: String(input.name || "").trim(),
    cpf,
    password: String(input.password || ""),
    ...(businessName ? { businessName } : {}),
    ...(cnpj ? { cnpj } : {}),
  };
}

export async function getCurrentUserProfile(): Promise<Nullable<UserProfile>> {
  const response = (await apiGet(`${USERS_BASE_PATH}/me`)) as UserResponse;
  return toUserViewModel(unwrapUserResponse(response));
}

export async function updateCurrentUserProfile(
  input: UpdateCurrentUserProfileInput,
): Promise<Nullable<UserProfile>> {
  const response = (await apiPut(
    `${USERS_BASE_PATH}/me`,
    toUserPayload(input),
  )) as UserResponse;
  const user = toUserViewModel(unwrapUserResponse(response));

  if (user) {
    updateSessionUser(user);
  }

  return user;
}
