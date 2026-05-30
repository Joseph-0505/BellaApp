import { ClinicPlan } from "@prisma/client";
import { z } from "zod";
import { upgradePlanBodySchema } from "./billing.schemas";

export type UpgradePlanRequestDto = z.infer<typeof upgradePlanBodySchema>;

export type BillingPlanResponseDto = {
  plan: ClinicPlan;
  trialEndsAt: string | null;
};
