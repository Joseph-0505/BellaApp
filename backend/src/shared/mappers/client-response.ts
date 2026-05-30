import { Prisma } from "@prisma/client";

type ClientRecord = Prisma.ClientGetPayload<Record<string, never>>;

export type ClientStatus = "novo" | "ativo" | "inativo" | "risco";

export type ClientInsights = {
  latestVisitAt?: Date | null;
  latestVisitNote?: string | null;
  nextAppointmentAt?: Date | null;
  professional?: string | null;
  totalSpent?: number;
  status?: ClientStatus;
};

export type ClientResponse = {
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
};

// Complementa os dados básicos do cliente com informações consolidadas sobre o relacionamento dele com o negócio.
export function toClientResponse(client: ClientRecord, insights: ClientInsights = {}): ClientResponse {
  return {
    id: client.id,
    name: client.name,
    email: client.email ?? null,
    phone: client.phone,
    cpf: client.cpf ?? null,
    notes: client.notes ?? null,
    latestVisitAt: insights.latestVisitAt ? insights.latestVisitAt.toISOString() : null,
    latestVisitNote: insights.latestVisitNote ?? client.notes ?? "Nenhum atendimento registrado",
    nextAppointmentAt: insights.nextAppointmentAt ? insights.nextAppointmentAt.toISOString() : null,
    professional: insights.professional ?? null,
    totalSpent: insights.totalSpent ?? 0,
    status: insights.status ?? "novo",
  };
}
