export type AppointmentStatus =
  | "pendente"
  | "confirmado"
  | "concluido"
  | "cancelado";

export type BillingPaymentStatus = "pendente" | "parcial" | "pago";
export type ReceivedBy = "clinica" | "profissional";

export interface BusinessProfile {
  businessName: string;
  cnpj: string;
  hasTeam: boolean;
  usesRooms: boolean;
}

export interface ClinicSummary {
  id: ID;
  plan: "TRIAL" | "INDIVIDUAL" | "TEAM";
  trialEndsAt: Nullable<string>;
}

export interface UserMembership {
  role: "ADMIN" | "PROFESSIONAL";
  professionalId: Nullable<ID>;
}

export interface UserProfessionalSummary {
  id: ID;
  name: string;
  specialty: string;
}

export interface UserPermissions {
  manageProfessionals: boolean;
  viewAllAgenda: boolean;
  viewAllCash: boolean;
}

export interface UserProfile {
  id: ID;
  name: string;
  email: string;
  cpf: string;
  businessProfile: Nullable<BusinessProfile>;
  clinic: Nullable<ClinicSummary>;
  membership: Nullable<UserMembership>;
  professional: Nullable<UserProfessionalSummary>;
  permissions: UserPermissions;
}

export interface Appointment {
  id: ID;
  clientId: ID;
  professionalId: string;
  roomId?: string;
  sala?: string;
  serviceId: ID;
  scheduledAt?: string;
  day: string;
  hour: string;
  cliente: string;
  servico: string;
  profissional: string;
  status: AppointmentStatus;
  valorEstimado: number;
  valorRecebido?: number;
  duracaoMin?: number;
  endHour?: string;
  observacoes: string;
  notes?: string;
  receivedBy?: ReceivedBy;
  billingId?: string;
  billingAmount?: number;
  paymentStatus?: Nullable<BillingPaymentStatus>;
  outstandingAmount?: Nullable<number>;
}
