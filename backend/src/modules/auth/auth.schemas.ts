import { z } from "zod";
import {
  cnpjSchema,
  cpfSchema,
  emailSchema,
  passwordSchema,
  requiredStringSchema,
} from "../../shared/validation/common-schemas";

const optionalStringToUndefined = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional(),
);

const optionalCnpjInputSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  cnpjSchema.optional(),
);

export const registerBodySchema = z
  .object({
    name: requiredStringSchema("Nome"),
    email: emailSchema,
    password: passwordSchema,
    cpf: cpfSchema,
    businessName: optionalStringToUndefined,
    cnpj: optionalCnpjInputSchema,
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.cnpj && !data.businessName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["businessName"],
        message: "Nome do negocio e obrigatorio quando CNPJ for informado.",
      });
    }
  });

export const loginBodySchema = z
  .object({
    email: emailSchema,
    password: requiredStringSchema("Senha", 72),
  })
  .strict();

export const logoutBodySchema = z
  .object({
    refreshToken: z.string().min(1),
  })
  .strict();

export const refreshTokenBodySchema = z
  .object({
    refreshToken: z.string().min(1),
  })
  .strict();

export const activationQuerySchema = z
  .object({
    token: z.string().trim().min(1, "Token de convite e obrigatorio."),
  })
  .strict();

export const activateBodySchema = z
  .object({
    token: z.string().trim().min(1, "Token de convite e obrigatorio."),
    password: passwordSchema,
  })
  .strict();

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type LogoutBody = z.infer<typeof logoutBodySchema>;
export type RefreshTokenBody = z.infer<typeof refreshTokenBodySchema>;
export type ActivationQuery = z.infer<typeof activationQuerySchema>;
export type ActivateBody = z.infer<typeof activateBodySchema>;
