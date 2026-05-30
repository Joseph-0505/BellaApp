import { AppointmentStatus, ReceivedBy } from "@prisma/client";
import { z } from "zod";
import {
  optionalStringSchema,
  paginationQuerySchema,
  uuidParamSchema,
} from "../../shared/validation/common-schemas";

export const appointmentStatusSchema = z.nativeEnum(AppointmentStatus, {
  errorMap: () => ({ message: "Status do agendamento inválido." }),
});

export const appointmentBodySchema = z
  .object({
    clientId: z.string().uuid("clientId inválido."),
    serviceId: z.string().uuid("serviceId inválido."),
    professionalId: z.string().uuid("professionalId inválido."),
    roomId: z.preprocess(
      (value) =>
        typeof value === "string" && value.trim() === "" ? undefined : value,
      z.string().uuid("roomId inválido.").optional(),
    ),
    scheduledAt: z.string().datetime({
      offset: true,
      message: "scheduledAt deve estar em formato ISO 8601.",
    }),
    status: appointmentStatusSchema,
    notes: optionalStringSchema("Observações", 500),
  })
  .strict();

export const appointmentParamsSchema = uuidParamSchema;

export const appointmentCompleteBodySchema = z
  .object({
    receivedBy: z
      .nativeEnum(ReceivedBy, {
        errorMap: () => ({ message: "receivedBy inválido." }),
      })
      .optional(),
  })
  .strict();

export const appointmentsQuerySchema = paginationQuerySchema
  .extend({
    status: appointmentStatusSchema.optional(),
    date: z.preprocess(
      (value) =>
        typeof value === "string" && value.trim() === "" ? undefined : value,
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD.")
        .optional(),
    ),
    clientId: z.preprocess(
      (value) =>
        typeof value === "string" && value.trim() === "" ? undefined : value,
      z.string().uuid("clientId inválido.").optional(),
    ),
    serviceId: z.preprocess(
      (value) =>
        typeof value === "string" && value.trim() === "" ? undefined : value,
      z.string().uuid("serviceId inválido.").optional(),
    ),
    professionalId: z.preprocess(
      (value) =>
        typeof value === "string" && value.trim() === "" ? undefined : value,
      z.string().uuid("professionalId inválido.").optional(),
    ),
    roomId: z.preprocess(
      (value) =>
        typeof value === "string" && value.trim() === "" ? undefined : value,
      z.string().uuid("roomId inválido.").optional(),
    ),
  })
  .strict();

export type AppointmentBody = z.infer<typeof appointmentBodySchema>;
export type AppointmentCompleteBody = z.infer<
  typeof appointmentCompleteBodySchema
>;
export type AppointmentParams = z.infer<typeof appointmentParamsSchema>;
export type AppointmentsQuery = z.infer<typeof appointmentsQuerySchema>;
