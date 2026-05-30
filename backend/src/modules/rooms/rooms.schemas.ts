import { z } from "zod";
import {
  optionalBooleanQuerySchema,
  paginationQuerySchema,
  requiredStringSchema,
  uuidParamSchema,
} from "../../shared/validation/common-schemas";

const colorSchema = z
  .string()
  .trim()
  .regex(/^#([0-9A-F]{6})$/i, "Cor inválida.")
  .optional();

export const roomBodySchema = z
  .object({
    name: requiredStringSchema("Nome"),
    color: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      colorSchema,
    ),
    active: z.boolean({
      required_error: "Campo active é obrigatório.",
      invalid_type_error: "Campo active deve ser booleano.",
    }),
  })
  .strict();

export const roomParamsSchema = uuidParamSchema;

export const roomsQuerySchema = paginationQuerySchema
  .extend({
    active: optionalBooleanQuerySchema,
  })
  .strict();

export type RoomBody = z.infer<typeof roomBodySchema>;
export type RoomParams = z.infer<typeof roomParamsSchema>;
export type RoomsQuery = z.infer<typeof roomsQuerySchema>;
