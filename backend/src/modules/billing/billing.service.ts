import { AppError } from "../../shared/errors/app-error";
import {
  assertClinicAdmin,
  userClinicContextService,
} from "../../shared/auth/user-clinic-context";
import { BillingPlanResponseDto, UpgradePlanRequestDto } from "./billing.dtos";
import { billingRepository } from "./billing.repository";

class BillingService {
  private toPlanResponse(clinic: {
    plan: BillingPlanResponseDto["plan"];
    trialEndsAt: Date | null;
  }): BillingPlanResponseDto {
    return {
      plan: clinic.plan,
      trialEndsAt: clinic.trialEndsAt ? clinic.trialEndsAt.toISOString() : null,
    };
  }

  async getCurrentPlan(userId: string): Promise<BillingPlanResponseDto> {
    const context = await userClinicContextService.getOrThrow(userId);
    const clinic = await billingRepository.findClinicPlan(context.clinicId);

    if (!clinic) {
      throw new AppError(404, "RESOURCE_NOT_FOUND", "Clinica nao encontrada.");
    }

    return this.toPlanResponse(clinic);
  }

  async upgradePlan(
    userId: string,
    input: UpgradePlanRequestDto,
  ): Promise<BillingPlanResponseDto> {
    const context = await userClinicContextService.getOrThrow(userId);
    assertClinicAdmin(context);

    const clinic = await billingRepository.upgradePlan(
      context.clinicId,
      input.plan,
    );
    return this.toPlanResponse(clinic);
  }
}

export const billingService = new BillingService();
