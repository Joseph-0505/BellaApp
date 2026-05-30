import { z } from "zod";
import {
  optionalCpfSchema,
  optionalEmailSchema,
  optionalStringSchema,
  paginationQuerySchema,
  requiredStringSchema,
  uuidParamSchema,
} from "../../shared/validation/common-schemas";

export const clientBodySchema = z
  .object({
    name: requiredStringSchema("Nome"),
    phone: requiredStringSchema("Telefone", 30),
    email: optionalEmailSchema,
    cpf: optionalCpfSchema,
    notes: optionalStringSchema("Observacoes", 500),
  })
  .strict();

export const clientParamsSchema = uuidParamSchema;
export const clientsQuerySchema = paginationQuerySchema;

export type ClientBody = z.infer<typeof clientBodySchema>;
export type ClientParams = z.infer<typeof clientParamsSchema>;
export type ClientsQuery = z.infer<typeof clientsQuerySchema>;
