export type Nullable<T> = T | null;

export interface BusinessProfile {
  businessName: string;
  cnpj: string;
  hasTeam: boolean;
  usesRooms: boolean;
}

export interface ClinicProfile {
  id: string;
  plan: "TRIAL" | "INDIVIDUAL" | "TEAM";
  trialEndsAt: Nullable<string>;
}

export interface MembershipProfile {
  role: "ADMIN" | "PROFESSIONAL";
  professionalId: Nullable<string>;
}

export interface ProfessionalSummary {
  id: string;
  name: string;
  specialty: string;
}

export interface UserPermissions {
  manageProfessionals: boolean;
  viewAllAgenda: boolean;
  viewAllCash: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  cpf: string;
  businessProfile: Nullable<BusinessProfile>;
  clinic: Nullable<ClinicProfile>;
  membership: Nullable<MembershipProfile>;
  professional: Nullable<ProfessionalSummary>;
  permissions: UserPermissions;
}

export interface AuthSession {
  token: string;
  refreshToken: string;
  expiresIn: string;
  refreshTokenExpiresIn: string;
  user: UserProfile;
}

export interface DefaultSchedule {
  mondayToFriday: {
    start: string;
    end: string;
  };
  saturday: {
    start: string;
    end: string;
  };
  sunday: {
    closed: boolean;
  };
}

export interface OnboardingStatus {
  completed: boolean;
  businessName: string;
  hasTeam: boolean;
  usesRooms: boolean;
  servicesCount: number;
  professionalsCount: number;
  roomsCount: number;
  defaultSchedule: DefaultSchedule;
}

export interface CompleteOnboardingResponse extends OnboardingStatus {
  created: {
    professional: boolean;
    services: string[];
    rooms: string[];
  };
}
