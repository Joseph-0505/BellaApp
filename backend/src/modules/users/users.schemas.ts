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

export const deleteCurrentUserBodySchema = z
  .object({
    password: z.string().min(1, "Senha atual é obrigatória.").max(72),
    confirmation: z.string().refine((value) => value === "EXCLUIR", {
      message: "Digite EXCLUIR para confirmar.",
    }),
  })
  .strict();
