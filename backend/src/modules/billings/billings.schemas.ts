import { PaymentMethod } from "@prisma/client";
import { z } from "zod";
import {
  optionalStringSchema,
  uuidParamSchema,
} from "../../shared/validation/common-schemas";

export const billingParamsSchema = uuidParamSchema;

export const payBillingBodySchema = z
  .object({
    amount: z.coerce
      .number()
      .positive("Valor do pagamento deve ser maior que zero."),
    paymentMethod: z.nativeEnum(PaymentMethod, {
      errorMap: () => ({ message: "Forma de pagamento inválida." }),
    }),
    notes: optionalStringSchema("Observação", 255),
  })
  .strict();

export type BillingParams = z.infer<typeof billingParamsSchema>;
export type PayBillingBody = z.infer<typeof payBillingBodySchema>;
