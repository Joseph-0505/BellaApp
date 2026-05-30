import {
  BillingStatus,
  CashMovementStatus,
  CashMovementType,
  Prisma,
  ReceivedBy,
} from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../shared/errors/app-error";
import { userClinicContextService } from "../../shared/auth/user-clinic-context";
import { toBillingResponse } from "../../shared/mappers/billing-response";
import { toCashMovementResponse } from "../../shared/mappers/cash-movement-response";
import {
  getTodayCashRegisterDate,
  cashRepository,
} from "../cash/cash.repository";
import { billingsRepository, PrismaExecutor } from "./billings.repository";
import { PayBillingRequestDto, PayBillingResponseDto } from "./billings.dtos";

export type AppointmentBillingSnapshot = {
  appointmentId: string;
  appointmentScheduledAt: Date;
  clientId: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  professionalId: string | null;
  professionalName: string | null;
  amount: Prisma.Decimal;
  receivedBy: ReceivedBy;
};

class BillingsService {
  async ensureForCompletedAppointment(args: {
    userId: string;
    clinicId: string;
    appointment: AppointmentBillingSnapshot;
    db?: PrismaExecutor;
  }) {
    const { userId, clinicId, appointment, db = prisma } = args;
    const billing = await billingsRepository.findByAppointmentId(
      clinicId,
      appointment.appointmentId,
      db,
    );

    if (!billing) {
      return billingsRepository.create(
        {
          userId,
          clinicId,
          appointmentId: appointment.appointmentId,
          appointmentScheduledAt: appointment.appointmentScheduledAt,
          clientId: appointment.clientId,
          clientName: appointment.clientName,
          serviceId: appointment.serviceId,
          serviceName: appointment.serviceName,
          professionalId: appointment.professionalId,
          professionalName: appointment.professionalName,
          amount: appointment.amount,
          remainingAmount: appointment.amount,
          receivedBy: appointment.receivedBy,
        },
        db,
      );
    }

    if (billing.receivedBy !== appointment.receivedBy) {
      if (new Prisma.Decimal(billing.paidAmount).greaterThan(0)) {
        throw new AppError(
          409,
          "BILLING_ALREADY_PAID",
          "Não é possível alterar quem recebeu após registrar pagamento.",
        );
      }

      return billingsRepository.update(
        billing.id,
        {
          receivedBy: appointment.receivedBy,
        },
        db,
      );
    }

    return billing;
  }

  private async getBillingOrThrow(
    clinicId: string,
    id: string,
    db: PrismaExecutor,
  ) {
    const billing = await billingsRepository.findById(clinicId, id, db);

    if (!billing) {
      throw new AppError(404, "RESOURCE_NOT_FOUND", "Cobrança não encontrada.");
    }

    return billing;
  }

  async pay(
    userId: string,
    id: string,
    input: PayBillingRequestDto,
  ): Promise<PayBillingResponseDto> {
    return prisma.$transaction(async (transaction) => {
      const context = await userClinicContextService.getOrThrow(
        userId,
        transaction,
      );
      const billing = await this.getBillingOrThrow(
        context.clinicId,
        id,
        transaction,
      );
      const paymentAmount = new Prisma.Decimal(input.amount);
      const remainingAmount = new Prisma.Decimal(billing.remainingAmount);

      if (remainingAmount.lte(0) || billing.status === BillingStatus.PAID) {
        throw new AppError(
          409,
          "BILLING_ALREADY_PAID",
          "Cobrança já está totalmente paga.",
        );
      }

      if (paymentAmount.greaterThan(remainingAmount)) {
        throw new AppError(
          400,
          "INVALID_PAYMENT_AMOUNT",
          "Valor do pagamento não pode ser maior que o saldo pendente.",
        );
      }

      const cashProfessionalId =
        billing.receivedBy === ReceivedBy.PROFESSIONAL
          ? (billing.professionalId ?? null)
          : null;

      if (
        billing.receivedBy === ReceivedBy.PROFESSIONAL &&
        !cashProfessionalId
      ) {
        throw new AppError(
          409,
          "PROFESSIONAL_BILLING_CONTEXT_MISSING",
          "A cobrança está marcada para profissional, mas não possui um profissional vinculado.",
        );
      }

      const cashRegister = await cashRepository.getOrCreateDaily(
        {
          userId,
          clinicId: context.clinicId,
          registerDate: getTodayCashRegisterDate(),
          professionalId: cashProfessionalId,
        },
        transaction,
      );

      if (cashRegister.status !== "OPEN") {
        throw new AppError(
          409,
          "CASH_REGISTER_CLOSED",
          "O caixa do dia já está fechado.",
        );
      }

      const nextPaidAmount = new Prisma.Decimal(billing.paidAmount).plus(
        paymentAmount,
      );
      const nextRemainingAmount = remainingAmount.minus(paymentAmount);
      const nextStatus = nextRemainingAmount.eq(0)
        ? BillingStatus.PAID
        : BillingStatus.PARTIALLY_PAID;

      const updatedBilling = await billingsRepository.update(
        billing.id,
        {
          paidAmount: nextPaidAmount,
          remainingAmount: nextRemainingAmount,
          status: nextStatus,
        },
        transaction,
      );

      const movement = await billingsRepository.createMovement(
        {
          userId,
          clinicId: context.clinicId,
          professionalId: cashProfessionalId,
          billingId: billing.id,
          cashRegisterId: cashRegister.id,
          type: CashMovementType.INCOME,
          status: CashMovementStatus.PAID,
          paymentMethod: input.paymentMethod,
          ...(input.notes ? { description: input.notes } : {}),
          amount: paymentAmount,
          countsInCash: true,
        },
        transaction,
      );

      return {
        billing: toBillingResponse(updatedBilling),
        movement: toCashMovementResponse(movement),
      };
    });
  }
}

export const billingsService = new BillingsService();
