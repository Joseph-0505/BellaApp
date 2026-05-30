import { ClinicPlan } from "@prisma/client";
import { z } from "zod";

export const upgradePlanBodySchema = z
  .object({
    plan: z.enum([ClinicPlan.INDIVIDUAL, ClinicPlan.TEAM], {
      errorMap: () => ({ message: "Plano invalido para upgrade." }),
    }),
  })
  .strict();

export type UpgradePlanBody = z.infer<typeof upgradePlanBodySchema>;
