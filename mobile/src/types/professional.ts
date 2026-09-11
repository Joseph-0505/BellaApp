export type ProfessionalStatus = "ativo" | "inativo";
export type ProfessionalTone = "rose" | "sand" | "sage" | "mist";
export type ProfessionalAccessStatus =
  | "active"
  | "invite_pending"
  | "invite_expired"
  | "no_access";

export interface ProfessionalProfile {
  id: string;
  name: string;
  specialty: string;
  email: string | null;
  phone: string;
  status: ProfessionalStatus;
  initials: string;
  tone: ProfessionalTone;
  accessStatus: ProfessionalAccessStatus;
  inviteExpiresAt: string | null;
}

export interface ProfessionalsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProfessionalsListResponse {
  data: ProfessionalProfile[];
  meta: ProfessionalsPagination;
}
