import {
  CashMovementStatus,
  CashMovementType,
  CashRegisterStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../lib/prisma";

type PrismaExecutor = Prisma.TransactionClient | typeof prisma;

type CashScopeArgs = {
  userId: string;
  clinicId: string;
  registerDate: Date;
  professionalId?: string | null | undefined;
};

function buildScopeKey(professionalId?: string | null): string {
  return professionalId ?? "clinic";
}

const cashRegisterInclude = {
  professional: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.CashRegisterInclude;

export function getTodayCashRegisterDate(referenceDate = new Date()): Date {
  return new Date(
    Date.UTC(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate(),
      0,
      0,
      0,
      0,
    ),
  );
}

class CashRepository {
  getDaily(args: CashScopeArgs, db: PrismaExecutor = prisma) {
    const { clinicId, professionalId, registerDate } = args;

    return db.cashRegister.findUnique({
      where: {
        clinicId_registerDate_scopeKey: {
          clinicId,
          registerDate,
          scopeKey: buildScopeKey(professionalId),
        },
      },
      include: cashRegisterInclude,
    });
  }

  getOrCreateDaily(args: CashScopeArgs, db: PrismaExecutor = prisma) {
    const { userId, clinicId, professionalId, registerDate } = args;

    return db.cashRegister.upsert({
      where: {
        clinicId_registerDate_scopeKey: {
          clinicId,
          registerDate,
          scopeKey: buildScopeKey(professionalId),
        },
      },
      update: {},
      create: {
        userId,
        clinicId,
        professionalId: professionalId ?? null,
        scopeKey: buildScopeKey(professionalId),
        registerDate,
        status: CashRegisterStatus.OPEN,
      },
      include: cashRegisterInclude,
    });
  }

  open(
    args: CashScopeArgs & { openingAmount: Prisma.Decimal },
    db: PrismaExecutor = prisma,
  ) {
    const { userId, clinicId, professionalId, registerDate, openingAmount } =
      args;

    return db.cashRegister.create({
      data: {
        userId,
        clinicId,
        professionalId: professionalId ?? null,
        scopeKey: buildScopeKey(professionalId),
        registerDate,
        status: CashRegisterStatus.OPEN,
        openingAmount,
      },
      include: cashRegisterInclude,
    });
  }

  listCashMovements(cashRegisterId: string, db: PrismaExecutor = prisma) {
    return db.cashMovement.findMany({
      where: {
        cashRegisterId,
        countsInCash: true,
      },
      include: {
        billing: {
          select: {
            clientName: true,
            serviceName: true,
            professionalName: true,
          },
        },
      },
      orderBy: {
        occurredAt: "desc",
      },
    });
  }

  sumMovementsByType(
    cashRegisterId: string,
    type: CashMovementType,
    db: PrismaExecutor = prisma,
  ) {
    return db.cashMovement.aggregate({
      where: {
        cashRegisterId,
        countsInCash: true,
        status: CashMovementStatus.PAID,
        type,
      },
      _sum: {
        amount: true,
      },
    });
  }

  close(
    id: string,
    data: {
      totalPaidSnapshot: Prisma.Decimal;
      totalExpensesSnapshot: Prisma.Decimal;
      totalBalanceSnapshot: Prisma.Decimal;
      informedClosingAmount: Prisma.Decimal;
      differenceAmount: Prisma.Decimal;
      closedAt: Date;
      status: CashRegisterStatus;
    },
    db: PrismaExecutor = prisma,
  ) {
    return db.cashRegister.update({
      where: { id },
      data,
      include: cashRegisterInclude,
    });
  }
}

export const cashRepository = new CashRepository();

export { buildScopeKey };

export type { CashScopeArgs, PrismaExecutor };
