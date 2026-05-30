import { CashRegisterStatus, Prisma } from "@prisma/client";
import {
  CashMovementResponse,
  toCashMovementResponse,
} from "./cash-movement-response";

type CashRegisterRecord = Prisma.CashRegisterGetPayload<{
  include: {
    professional: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

export type CashResponse = {
  id: string;
  date: string;
  status: CashRegisterStatus;
  scope: "CLINIC" | "PROFESSIONAL";
  professionalId: string | null;
  professionalName: string | null;
  openingAmount: number;
  totalPaid: number;
  totalExpenses: number;
  totalBalance: number;
  expectedClosingAmount: number;
  informedClosingAmount: number | null;
  differenceAmount: number | null;
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  movements: CashMovementResponse[];
};

export function toCashResponse(args: {
  cashRegister: CashRegisterRecord;
  totalPaid: number;
  totalExpenses: number;
  totalBalance: number;
  movements: Parameters<typeof toCashMovementResponse>[0][];
}): CashResponse {
  const { cashRegister, totalPaid, totalExpenses, totalBalance, movements } =
    args;

  return {
    id: cashRegister.id,
    date: cashRegister.registerDate.toISOString(),
    status: cashRegister.status,
    scope: cashRegister.professionalId ? "PROFESSIONAL" : "CLINIC",
    professionalId: cashRegister.professionalId ?? null,
    professionalName: cashRegister.professional?.name ?? null,
    openingAmount: Number(cashRegister.openingAmount),
    totalPaid,
    totalExpenses,
    totalBalance,
    expectedClosingAmount: Number(cashRegister.openingAmount) + totalBalance,
    informedClosingAmount:
      cashRegister.informedClosingAmount !== null
        ? Number(cashRegister.informedClosingAmount)
        : null,
    differenceAmount:
      cashRegister.differenceAmount !== null
        ? Number(cashRegister.differenceAmount)
        : null,
    openedAt: cashRegister.openedAt.toISOString(),
    closedAt: cashRegister.closedAt?.toISOString() ?? null,
    createdAt: cashRegister.createdAt.toISOString(),
    movements: movements.map(toCashMovementResponse),
  };
}
