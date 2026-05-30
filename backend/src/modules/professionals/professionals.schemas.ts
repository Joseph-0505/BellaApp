import { z } from "zod";
import {
  emailSchema,
  optionalEmailSchema,
  paginationQuerySchema,
  requiredStringSchema,
  uuidParamSchema,
} from "../../shared/validation/common-schemas";

export const professionalStatusSchema = z.enum(["ativo", "inativo"], {
  errorMap: () => ({ message: "Status do profissional invalido." }),
});

export const professionalBodySchema = z
  .object({
    name: requiredStringSchema("Nome"),
    specialty: requiredStringSchema("Especialidade"),
    phone: requiredStringSchema("Telefone", 30),
    email: optionalEmailSchema,
    status: professionalStatusSchema,
  })
  .strict();

export const inviteProfessionalBodySchema = z
  .object({
    name: requiredStringSchema("Nome"),
    email: emailSchema,
  })
  .strict();

export const professionalParamsSchema = uuidParamSchema;

export const professionalsQuerySchema = paginationQuerySchema
  .extend({
    status: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      professionalStatusSchema.optional(),
    ),
  })
  .strict();

export type ProfessionalBody = z.infer<typeof professionalBodySchema>;
export type InviteProfessionalBody = z.infer<typeof inviteProfessionalBodySchema>;
export type ProfessionalParams = z.infer<typeof professionalParamsSchema>;
export type ProfessionalsQuery = z.infer<typeof professionalsQuerySchema>;
