import { apiDelete, apiGet, apiPost, apiPut, unwrapData } from "./api";

export type AppointmentStatus = "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELED";
export const statusLabels: Record<AppointmentStatus, string> = {
  SCHEDULED: "Agendado", CONFIRMED: "Confirmado", COMPLETED: "Concluído", CANCELED: "Cancelado",
};
export interface Appointment {
  id: string;
  clientId: string;
  serviceId: string;
  professionalId: string | null;
  roomId?: string | null;
  scheduledAt: string;
  status: AppointmentStatus;
  notes: string | null;
}
export type NewAppointment = Omit<Appointment, "id" | "professionalId" | "notes" | "roomId"> & { professionalId: string; roomId?: string; notes?: string };

export async function updateAppointment(id: string, payload: NewAppointment) {
  const appointment = unwrapData<Appointment>(await apiPut(`/api/v1/appointments/${id}`, payload));
  if (!appointment) throw new Error("Resposta inválida ao editar agendamento.");
  return appointment;
}

export async function deleteAppointment(id: string) {
  await apiDelete(`/api/v1/appointments/${id}`);
}

export async function createAppointment(payload: NewAppointment) {
  const appointment = unwrapData<Appointment>(await apiPost("/api/v1/appointments", payload));
  if (!appointment) throw new Error("Resposta inválida ao salvar agendamento.");
  return appointment;
}

// Paginate so appointments outside the first page remain visible.
export async function listAppointments() {
  const items: Appointment[] = [];
  for (let page = 1; ; page++) {
    const response = await apiGet("/api/v1/appointments", { query: { page, limit: 100 } }) as { data: Appointment[]; meta: { total: number } };
    items.push(...response.data);
    if (!response.data.length || items.length >= response.meta.total) return items;
  }
}
