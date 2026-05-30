import { FastifyInstance } from "fastify";
import { authenticate } from "../../shared/auth/authenticate";
import { requireActivePlan } from "../../shared/auth/require-active-plan";
import { validateRequest } from "../../shared/http/validate-request";
import {
  CreateProfessionalRequestDto,
  InviteProfessionalRequestDto,
  ProfessionalParamsDto,
  ProfessionalsQueryDto,
  UpdateProfessionalRequestDto,
} from "./professionals.dtos";
import {
  inviteProfessionalBodySchema,
  professionalBodySchema,
  professionalParamsSchema,
  professionalsQuerySchema,
} from "./professionals.schemas";
import { professionalsController } from "./professionals.controller";

export async function professionalsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", authenticate);

  app.get<{ Querystring: ProfessionalsQueryDto }>(
    "/",
    {
      preValidation: validateRequest({ query: professionalsQuerySchema }),
    },
    professionalsController.list,
  );

  app.post<{ Body: InviteProfessionalRequestDto }>(
    "/invite",
    {
      preValidation: [
        requireActivePlan,
        validateRequest({ body: inviteProfessionalBodySchema }),
      ],
    },
    professionalsController.invite,
  );

  app.post<{ Body: CreateProfessionalRequestDto }>(
    "/",
    {
      preValidation: [
        requireActivePlan,
        validateRequest({ body: professionalBodySchema }),
      ],
    },
    professionalsController.create,
  );

  app.post<{ Params: ProfessionalParamsDto }>(
    "/:id/resend-invite",
    {
      preValidation: validateRequest({ params: professionalParamsSchema }),
    },
    professionalsController.resendInvite,
  );

  app.get<{ Params: ProfessionalParamsDto }>(
    "/:id",
    {
      preValidation: validateRequest({ params: professionalParamsSchema }),
    },
    professionalsController.getById,
  );

  app.put<{
    Params: ProfessionalParamsDto;
    Body: UpdateProfessionalRequestDto;
  }>(
    "/:id",
    {
      preValidation: validateRequest({
        params: professionalParamsSchema,
        body: professionalBodySchema,
      }),
    },
    professionalsController.update,
  );

  app.delete<{ Params: ProfessionalParamsDto }>(
    "/:id",
    {
      preValidation: validateRequest({ params: professionalParamsSchema }),
    },
    professionalsController.remove,
  );
}
