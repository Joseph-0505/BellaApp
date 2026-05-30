import { z } from "zod";
import { AppointmentResponse } from "../../shared/mappers/appointment-response";
import { BillingResponse } from "../../shared/mappers/billing-response";
import {
  appointmentBodySchema,
  appointmentCompleteBodySchema,
  appointmentParamsSchema,
  appointmentsQuerySchema,
} from "./appointments.schemas";

export type AppointmentRequestDto = z.infer<typeof appointmentBodySchema>;
export type CompleteAppointmentRequestDto = z.infer<
  typeof appointmentCompleteBodySchema
>;
export type AppointmentParamsDto = z.infer<typeof appointmentParamsSchema>;
export type AppointmentsQueryDto = z.infer<typeof appointmentsQuerySchema>;

export type CreateAppointmentResponseDto = AppointmentResponse;
export type GetAppointmentResponseDto = AppointmentResponse;
export type UpdateAppointmentResponseDto = AppointmentResponse;
export type CompleteAppointmentResponseDto = {
  appointment: AppointmentResponse;
  billing: BillingResponse;
};
export type ListAppointmentsResponseDto = {
  data: AppointmentResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
