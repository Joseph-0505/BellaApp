export type ServiceRisk = "baixo" | "medio" | "alto";

export interface ServiceProfile {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number;
  active: boolean;
  risk: ServiceRisk;
  riskTone: ServiceRisk;
  riskLabel: string;
  icon: string;
  soldCount: number;
}

export interface ServicesPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ServicesListResponse {
  data: ServiceProfile[];
  meta: ServicesPagination;
}
