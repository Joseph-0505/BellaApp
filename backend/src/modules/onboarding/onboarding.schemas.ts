import { z } from "zod";
import { requiredStringSchema } from "../../shared/validation/common-schemas";

export const completeOnboardingBodySchema = z
  .object({
    businessName: requiredStringSchema("Nome do negÃ³cio"),
  })
  .strict();

export type CompleteOnboardingBody = z.infer<typeof completeOnboardingBodySchema>;
