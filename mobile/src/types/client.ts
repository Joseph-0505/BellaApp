export type ClientStatus = "novo" | "ativo" | "inativo" | "risco";

export interface ClientProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  cpf: string | null;
  notes: string | null;
  latestVisitAt: string | null;
  latestVisitNote: string;
  nextAppointmentAt: string | null;
  professional: string | null;
  totalSpent: number;
  status: ClientStatus;
}

export interface ClientsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ClientsListResponse {
  data: ClientProfile[];
  meta: ClientsPagination;
}
