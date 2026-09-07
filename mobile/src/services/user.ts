import type { Nullable, UserProfile } from "../types/auth";
import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
  clearSession,
  updateSessionUser,
  unwrapData,
} from "./api";

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
  avatarUrl?: string | null;
  businessProfile?: Nullable<ApiBusinessProfile>;
  clinic?: Nullable<ApiClinic>;
  membership?: Nullable<ApiMembership>;
  professional?: Nullable<ApiProfessionalSummary>;
  permissions?: Nullable<ApiPermissions>;
}

export interface UpdateCurrentUserPayload {
  name: string;
  cpf: string;
  password: string;
  businessName?: string;
  cnpj?: string;
}

export interface ProfilePhotoPayload {
  file?: Blob;
  fileName: string;
  mimeType: string;
  uri: string;
}

export interface DeleteCurrentUserPayload {
  confirmation: "EXCLUIR";
  password: string;
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
    avatarUrl: user.avatarUrl || null,
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

export async function uploadCurrentUserPhoto(
  payload: ProfilePhotoPayload,
): Promise<Nullable<UserProfile>> {
  const formData = new FormData();

  if (payload.file) {
    formData.append("photo", payload.file, payload.fileName);
  } else {
    formData.append("photo", {
      name: payload.fileName,
      type: payload.mimeType,
      uri: payload.uri,
    } as unknown as Blob);
  }

  const response = await apiPost(`${USERS_BASE_PATH}/me/avatar`, formData);
  const user = toUserViewModel(unwrapData<ApiUser>(response));

  if (user) updateSessionUser(user);
  return user;
}

export async function removeCurrentUserPhoto(): Promise<Nullable<UserProfile>> {
  const response = await apiDelete(`${USERS_BASE_PATH}/me/avatar`);
  const user = toUserViewModel(unwrapData<ApiUser>(response));

  if (user) updateSessionUser(user);
  return user;
}

export async function deleteCurrentUserAccount(payload: DeleteCurrentUserPayload) {
  await apiDelete(`${USERS_BASE_PATH}/me`, payload);
  clearSession();
}
