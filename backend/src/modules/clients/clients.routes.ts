import { FastifyInstance } from "fastify";
import { authenticate } from "../../shared/auth/authenticate";
import { requireActivePlan } from "../../shared/auth/require-active-plan";
import { validateRequest } from "../../shared/http/validate-request";
import {
  ClientParamsDto,
  ClientRequestDto,
  ClientsQueryDto,
} from "./clients.dtos";
import {
  clientBodySchema,
  clientParamsSchema,
  clientsQuerySchema,
} from "./clients.schemas";
import { clientsController } from "./clients.controller";

export async function clientsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", authenticate);

  app.get<{ Querystring: ClientsQueryDto }>(
    "/",
    {
      preValidation: validateRequest({ query: clientsQuerySchema }),
    },
    clientsController.list,
  );

  app.post<{ Body: ClientRequestDto }>(
    "/",
    {
      preValidation: [
        requireActivePlan,
        validateRequest({ body: clientBodySchema }),
      ],
    },
    clientsController.create,
  );

  app.get<{ Params: ClientParamsDto }>(
    "/:id",
    {
      preValidation: validateRequest({ params: clientParamsSchema }),
    },
    clientsController.getById,
  );

  app.put<{ Params: ClientParamsDto; Body: ClientRequestDto }>(
    "/:id",
    {
      preValidation: validateRequest({
        params: clientParamsSchema,
        body: clientBodySchema,
      }),
    },
    clientsController.update,
  );

  app.delete<{ Params: ClientParamsDto }>(
    "/:id",
    {
      preValidation: validateRequest({ params: clientParamsSchema }),
    },
    clientsController.remove,
  );
}
