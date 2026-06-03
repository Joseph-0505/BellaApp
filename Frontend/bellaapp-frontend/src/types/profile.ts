import type { AppointmentStatus, UserProfile } from "./entities";

export interface ProfileFormData {
  businessName: string;
  cnpj: string;
  confirmPassword: string;
  cpf: string;
  email: string;
  name: string;
  password: string;
}

export type ProfileFormFieldName = keyof ProfileFormData;

export interface UpdateCurrentUserProfileInput {
  businessName: string;
  cnpj: string;
  cpf: string;
  name: string;
  password: string;
}

export interface AppointmentUpdateChanges {
  status?: AppointmentStatus;
  day?: string;
  hour?: string;
  notes?: string;
  observacoes?: string;
  professionalId?: string;
}

export type AppointmentUpdateInput = AppointmentStatus | AppointmentUpdateChanges;

export type AppointmentUpdateHandler = (
  appointmentId: ID,
  changes: AppointmentUpdateInput,
) => Promise<boolean | void>;

export interface ProfileAuthContextValue {
  refreshCurrentUser: () => Promise<Nullable<UserProfile>>;
  user: Nullable<UserProfile>;
}
