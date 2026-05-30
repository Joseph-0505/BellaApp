import { z } from "zod";

const optionalProfessionalIdSchema = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().uuid("professionalId inválido.").optional(),
);

export const cashQuerySchema = z
  .object({
    professionalId: optionalProfessionalIdSchema,
  })
  .strict();

export const openCashBodySchema = z
  .object({
    professionalId: optionalProfessionalIdSchema,
    openingAmount: z.coerce
      .number()
      .min(0, "Valor de abertura não pode ser negativo."),
  })
  .strict();

export const closeCashBodySchema = z
  .object({
    professionalId: optionalProfessionalIdSchema,
    informedClosingAmount: z.coerce
      .number()
      .min(0, "Valor informado não pode ser negativo."),
  })
  .strict();

export type CashQuery = z.infer<typeof cashQuerySchema>;
export type OpenCashBody = z.infer<typeof openCashBodySchema>;
export type CloseCashBody = z.infer<typeof closeCashBodySchema>;
