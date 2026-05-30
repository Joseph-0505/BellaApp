import {
  BillingStatus,
  CashMovementStatus,
  CashMovementType,
  PaymentMethod,
  Prisma,
  ReceivedBy,
} from "@prisma/client";
import { prisma } from "../../lib/prisma";

type PrismaExecutor = Prisma.TransactionClient | typeof prisma;

class BillingsRepository {
  findById(clinicId: string, id: string, db: PrismaExecutor = prisma) {
    return db.billing.findFirst({
      where: {
        id,
        clinicId,
      },
    });
  }

  findByAppointmentId(
    clinicId: string,
    appointmentId: string,
    db: PrismaExecutor = prisma,
  ) {
    return db.billing.findFirst({
      where: {
        appointmentId,
        clinicId,
      },
    });
  }

  create(
    data: {
      userId: string;
      clinicId: string;
      appointmentId: string;
      appointmentScheduledAt: Date;
      clientId: string;
      clientName: string;
      serviceId: string;
      serviceName: string;
      professionalId?: string | null;
      professionalName?: string | null;
      amount: Prisma.Decimal;
      remainingAmount: Prisma.Decimal;
      receivedBy: ReceivedBy;
    },
    db: PrismaExecutor = prisma,
  ) {
    return db.billing.create({
      data: {
        userId: data.userId,
        clinicId: data.clinicId,
        appointmentId: data.appointmentId,
        appointmentScheduledAt: data.appointmentScheduledAt,
        clientId: data.clientId,
        clientName: data.clientName,
        serviceId: data.serviceId,
        serviceName: data.serviceName,
        professionalId: data.professionalId ?? null,
        professionalName: data.professionalName ?? null,
        amount: data.amount,
        remainingAmount: data.remainingAmount,
        receivedBy: data.receivedBy,
      },
    });
  }

  update(
    id: string,
    data: {
      paidAmount?: Prisma.Decimal;
      remainingAmount?: Prisma.Decimal;
      status?: BillingStatus;
      receivedBy?: ReceivedBy;
    },
    db: PrismaExecutor = prisma,
  ) {
    return db.billing.update({
      where: { id },
      data,
    });
  }

  createMovement(
    data: {
      userId: string;
      clinicId: string;
      professionalId?: string | null;
      billingId: string;
      cashRegisterId: string;
      type: CashMovementType;
      status: CashMovementStatus;
      paymentMethod?: PaymentMethod;
      description?: string;
      amount: Prisma.Decimal;
      countsInCash: boolean;
    },
    db: PrismaExecutor = prisma,
  ) {
    return db.cashMovement.create({
      data: {
        ...data,
        professionalId: data.professionalId ?? null,
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
    });
  }
}

export const billingsRepository = new BillingsRepository();

export type { PrismaExecutor };
