import { z } from "zod";
import {
  optionalBooleanQuerySchema,
  optionalStringSchema,
  paginationQuerySchema,
  requiredStringSchema,
  uuidParamSchema,
} from "../../shared/validation/common-schemas";
import { serviceIconValues, serviceRiskValues } from "../../shared/utils/service-catalog";

const optionalNumericQuerySchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.coerce.number().min(0).optional(),
);

export const serviceRiskSchema = z.enum(serviceRiskValues, {
  errorMap: () => ({ message: "Nível de risco inválido." }),
});

export const serviceIconSchema = z.enum(serviceIconValues, {
  errorMap: () => ({ message: "Ícone de serviço inválido." }),
});

export const serviceBodySchema = z
  .object({
    name: requiredStringSchema("Nome"),
    description: optionalStringSchema("Descrição", 1000),
    price: z.coerce.number().min(0, "Preço não pode ser negativo."),
    durationMinutes: z.coerce.number().int().positive("Duração deve ser maior que zero."),
    risk: serviceRiskSchema.optional(),
    icon: serviceIconSchema.optional(),
    active: z.boolean({
      required_error: "Campo active é obrigatório.",
      invalid_type_error: "Campo active deve ser booleano.",
    }),
  })
  .strict();

export const serviceParamsSchema = uuidParamSchema;

export const servicesQuerySchema = paginationQuerySchema
  .extend({
    active: optionalBooleanQuerySchema,
    maxDurationMinutes: optionalNumericQuerySchema,
    maxPrice: optionalNumericQuerySchema,
    minDurationMinutes: optionalNumericQuerySchema,
    minPrice: optionalNumericQuerySchema,
    risk: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      serviceRiskSchema.optional(),
    ),
  })
  .strict();

export type ServiceBody = z.infer<typeof serviceBodySchema>;
export type ServiceParams = z.infer<typeof serviceParamsSchema>;
export type ServicesQuery = z.infer<typeof servicesQuerySchema>;
