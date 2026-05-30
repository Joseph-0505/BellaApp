import { CashMovementType, CashRegisterStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../shared/errors/app-error";
import {
  resolveScopedProfessionalId,
  userClinicContextService,
} from "../../shared/auth/user-clinic-context";
import { toCashResponse } from "../../shared/mappers/cash-response";
import {
  CloseCashRequestDto,
  CloseCashResponseDto,
  GetCashResponseDto,
  OpenCashRequestDto,
  OpenCashResponseDto,
} from "./cash.dtos";
import {
  cashRepository,
  getTodayCashRegisterDate,
  PrismaExecutor,
} from "./cash.repository";

class CashService {
  private async buildSummary(cashRegisterId: string, db: PrismaExecutor) {
    const [movements, incomeAggregate, expenseAggregate] = await Promise.all([
      cashRepository.listCashMovements(cashRegisterId, db),
      cashRepository.sumMovementsByType(
        cashRegisterId,
        CashMovementType.INCOME,
        db,
      ),
      cashRepository.sumMovementsByType(
        cashRegisterId,
        CashMovementType.EXPENSE,
        db,
      ),
    ]);

    const totalPaid = Number(incomeAggregate._sum.amount ?? 0);
    const totalExpenses = Number(expenseAggregate._sum.amount ?? 0);

    return {
      movements,
      totalPaid,
      totalExpenses,
      totalBalance: totalPaid - totalExpenses,
    };
  }

  private async resolveScope(
    userId: string,
    professionalId?: string | null,
    db: PrismaExecutor = prisma,
  ) {
    const context = await userClinicContextService.getOrThrow(userId, db);

    return {
      context,
      clinicId: context.clinicId,
      professionalId: resolveScopedProfessionalId(context, professionalId),
    };
  }

  async getToday(
    userId: string,
    professionalId?: string | null,
  ): Promise<GetCashResponseDto> {
    const scope = await this.resolveScope(userId, professionalId);
    const registerDate = getTodayCashRegisterDate();
    const cashRegister = await cashRepository.getDaily({
      userId,
      clinicId: scope.clinicId,
      registerDate,
      professionalId: scope.professionalId,
    });

    if (!cashRegister) {
      return null;
    }

    const summary = await this.buildSummary(cashRegister.id, prisma);

    return toCashResponse({
      cashRegister,
      ...summary,
    });
  }

  async openToday(
    userId: string,
    input: OpenCashRequestDto,
  ): Promise<OpenCashResponseDto> {
    const scope = await this.resolveScope(userId, input.professionalId);
    const registerDate = getTodayCashRegisterDate();
    const existingRegister = await cashRepository.getDaily({
      userId,
      clinicId: scope.clinicId,
      registerDate,
      professionalId: scope.professionalId,
    });

    if (existingRegister) {
      throw new AppError(
        409,
        existingRegister.status === CashRegisterStatus.CLOSED
          ? "CASH_REGISTER_CLOSED"
          : "CASH_REGISTER_ALREADY_OPEN",
        existingRegister.status === CashRegisterStatus.CLOSED
          ? "O caixa do dia já foi fechado para este escopo."
          : "Já existe um caixa aberto para este escopo hoje.",
      );
    }

    const cashRegister = await cashRepository.open({
      userId,
      clinicId: scope.clinicId,
      registerDate,
      professionalId: scope.professionalId,
      openingAmount: new Prisma.Decimal(input.openingAmount),
    });

    const summary = await this.buildSummary(cashRegister.id, prisma);

    return toCashResponse({
      cashRegister,
      ...summary,
    });
  }

  async closeToday(
    userId: string,
    input: CloseCashRequestDto,
  ): Promise<CloseCashResponseDto> {
    return prisma.$transaction(async (transaction) => {
      const scope = await this.resolveScope(
        userId,
        input.professionalId,
        transaction,
      );
      const registerDate = getTodayCashRegisterDate();
      const cashRegister = await cashRepository.getDaily(
        {
          userId,
          clinicId: scope.clinicId,
          registerDate,
          professionalId: scope.professionalId,
        },
        transaction,
      );

      if (!cashRegister) {
        throw new AppError(
          404,
          "CASH_REGISTER_NOT_FOUND",
          "Nenhum caixa foi aberto hoje para este escopo.",
        );
      }

      if (cashRegister.status === CashRegisterStatus.CLOSED) {
        throw new AppError(
          409,
          "CASH_REGISTER_CLOSED",
          "O caixa do dia já está fechado.",
        );
      }

      const summary = await this.buildSummary(cashRegister.id, transaction);
      const expectedClosingAmount =
        Number(cashRegister.openingAmount) + summary.totalBalance;
      const differenceAmount =
        input.informedClosingAmount - expectedClosingAmount;
      const closedCashRegister = await cashRepository.close(
        cashRegister.id,
        {
          totalPaidSnapshot: new Prisma.Decimal(summary.totalPaid),
          totalExpensesSnapshot: new Prisma.Decimal(summary.totalExpenses),
          totalBalanceSnapshot: new Prisma.Decimal(summary.totalBalance),
          informedClosingAmount: new Prisma.Decimal(
            input.informedClosingAmount,
          ),
          differenceAmount: new Prisma.Decimal(differenceAmount),
          closedAt: new Date(),
          status: CashRegisterStatus.CLOSED,
        },
        transaction,
      );

      return toCashResponse({
        cashRegister: closedCashRegister,
        ...summary,
      });
    });
  }
}

export const cashService = new CashService();
