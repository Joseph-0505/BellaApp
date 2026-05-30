import { z } from "zod";
import {
  cpfSchema,
  cnpjSchema,
  optionalStringSchema,
  passwordSchema,
  requiredStringSchema,
} from "../../shared/validation/common-schemas";

const optionalCnpjInputSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  cnpjSchema.optional(),
);

export const updateCurrentUserBodySchema = z
  .object({
    name: requiredStringSchema("Nome"),
    cpf: cpfSchema,
    password: passwordSchema,
    businessName: optionalStringSchema("Nome do negócio"),
    cnpj: optionalCnpjInputSchema,
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.cnpj && !data.businessName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["businessName"],
        message: "Nome do negócio é obrigatório quando CNPJ for informado.",
      });
    }
  });

export type UpdateCurrentUserBody = z.infer<typeof updateCurrentUserBodySchema>;
