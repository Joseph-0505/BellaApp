import {
  AppointmentStatus,
  BillingStatus,
  Prisma,
  ReceivedBy,
} from "@prisma/client";

type AppointmentRecord = Prisma.AppointmentGetPayload<{
  include: {
    billing: true;
  };
}>;

export type AppointmentResponse = {
  id: string;
  clientId: string;
  serviceId: string;
  professionalId: string | null;
  roomId: string | null;
  scheduledAt: string;
  status: AppointmentStatus;
  receivedBy: ReceivedBy;
  notes: string | null;
  billingId: string | null;
  billingAmount: number | null;
  billingStatus: BillingStatus | null;
  outstandingAmount: number | null;
};

// Padroniza a serializacao de agendamentos devolvidos pela API.
export function toAppointmentResponse(
  appointment: AppointmentRecord,
): AppointmentResponse {
  return {
    id: appointment.id,
    clientId: appointment.clientId,
    serviceId: appointment.serviceId,
    professionalId: appointment.professionalId ?? null,
    roomId: appointment.roomId ?? null,
    scheduledAt: appointment.scheduledAt.toISOString(),
    status: appointment.status,
    receivedBy: appointment.receivedBy,
    notes: appointment.notes ?? null,
    billingId: appointment.billing?.id ?? null,
    billingAmount: appointment.billing
      ? Number(appointment.billing.amount)
      : null,
    billingStatus: appointment.billing?.status ?? null,
    outstandingAmount: appointment.billing
      ? Number(appointment.billing.remainingAmount)
      : null,
  };
}
