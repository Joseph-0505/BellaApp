import { BillingStatus, Prisma, ReceivedBy } from "@prisma/client";

type BillingRecord = Prisma.BillingGetPayload<Record<string, never>>;

export type BillingResponse = {
  id: string;
  appointmentId: string | null;
  clientId: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  professionalId: string | null;
  professionalName: string | null;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: BillingStatus;
  receivedBy: ReceivedBy;
  appointmentScheduledAt: string;
  createdAt: string;
  updatedAt: string;
};

export function toBillingResponse(billing: BillingRecord): BillingResponse {
  return {
    id: billing.id,
    appointmentId: billing.appointmentId ?? null,
    clientId: billing.clientId,
    clientName: billing.clientName,
    serviceId: billing.serviceId,
    serviceName: billing.serviceName,
    professionalId: billing.professionalId ?? null,
    professionalName: billing.professionalName ?? null,
    amount: Number(billing.amount),
    paidAmount: Number(billing.paidAmount),
    remainingAmount: Number(billing.remainingAmount),
    status: billing.status,
    receivedBy: billing.receivedBy,
    appointmentScheduledAt: billing.appointmentScheduledAt.toISOString(),
    createdAt: billing.createdAt.toISOString(),
    updatedAt: billing.updatedAt.toISOString(),
  };
}
