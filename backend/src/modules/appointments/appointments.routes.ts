import { FastifyInstance } from "fastify";
import { authenticate } from "../../shared/auth/authenticate";
import { requireActivePlan } from "../../shared/auth/require-active-plan";
import { validateRequest } from "../../shared/http/validate-request";
import {
  AppointmentParamsDto,
  AppointmentRequestDto,
  AppointmentsQueryDto,
  CompleteAppointmentRequestDto,
} from "./appointments.dtos";
import {
  appointmentBodySchema,
  appointmentCompleteBodySchema,
  appointmentParamsSchema,
  appointmentsQuerySchema,
} from "./appointments.schemas";
import { appointmentsController } from "./appointments.controller";

export async function appointmentsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", authenticate);

  app.get<{ Querystring: AppointmentsQueryDto }>(
    "/",
    {
      preValidation: validateRequest({ query: appointmentsQuerySchema }),
    },
    appointmentsController.list,
  );

  app.post<{ Body: AppointmentRequestDto }>(
    "/",
    {
      preValidation: [
        requireActivePlan,
        validateRequest({ body: appointmentBodySchema }),
      ],
    },
    appointmentsController.create,
  );

  app.get<{ Params: AppointmentParamsDto }>(
    "/:id",
    {
      preValidation: validateRequest({ params: appointmentParamsSchema }),
    },
    appointmentsController.getById,
  );

  app.post<{
    Params: AppointmentParamsDto;
    Body: CompleteAppointmentRequestDto;
  }>(
    "/:id/complete",
    {
      preValidation: validateRequest({
        params: appointmentParamsSchema,
        body: appointmentCompleteBodySchema,
      }),
    },
    appointmentsController.complete,
  );

  app.put<{ Params: AppointmentParamsDto; Body: AppointmentRequestDto }>(
    "/:id",
    {
      preValidation: validateRequest({
        params: appointmentParamsSchema,
        body: appointmentBodySchema,
      }),
    },
    appointmentsController.update,
  );

  app.delete<{ Params: AppointmentParamsDto }>(
    "/:id",
    {
      preValidation: validateRequest({ params: appointmentParamsSchema }),
    },
    appointmentsController.remove,
  );
}
