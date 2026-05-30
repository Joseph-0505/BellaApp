import {
  CashMovementStatus,
  CashMovementType,
  PaymentMethod,
  Prisma,
} from "@prisma/client";

type CashMovementRecord = Prisma.CashMovementGetPayload<{
  include: {
    billing: {
      select: {
        clientName: true;
        serviceName: true;
        professionalName: true;
      };
    };
  };
}>;

export type CashMovementResponse = {
  id: string;
  billingId: string | null;
  type: CashMovementType;
  status: CashMovementStatus;
  paymentMethod: PaymentMethod | null;
  description: string | null;
  amount: number;
  countsInCash: boolean;
  occurredAt: string;
  clientName: string | null;
  serviceName: string | null;
  professionalName: string | null;
};

export function toCashMovementResponse(
  movement: CashMovementRecord,
): CashMovementResponse {
  return {
    id: movement.id,
    billingId: movement.billingId ?? null,
    type: movement.type,
    status: movement.status,
    paymentMethod: movement.paymentMethod ?? null,
    description: movement.description ?? null,
    amount: Number(movement.amount),
    countsInCash: movement.countsInCash,
    occurredAt: movement.occurredAt.toISOString(),
    clientName: movement.billing?.clientName ?? null,
    serviceName: movement.billing?.serviceName ?? null,
    professionalName: movement.billing?.professionalName ?? null,
  };
}
