import { FastifyInstance } from "fastify";
import { authenticate } from "../../shared/auth/authenticate";
import { validateRequest } from "../../shared/http/validate-request";
import { ServiceParamsDto, ServiceRequestDto, ServicesQueryDto } from "./services.dtos";
import {
  serviceBodySchema,
  serviceParamsSchema,
  servicesQuerySchema,
} from "./services.schemas";
import { servicesController } from "./services.controller";

export async function servicesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", authenticate);

  app.get<{ Querystring: ServicesQueryDto }>(
    "/",
    {
      preValidation: validateRequest({ query: servicesQuerySchema }),
    },
    servicesController.list,
  );

  app.post<{ Body: ServiceRequestDto }>(
    "/",
    {
      preValidation: validateRequest({ body: serviceBodySchema }),
    },
    servicesController.create,
  );

  app.get<{ Params: ServiceParamsDto }>(
    "/:id",
    {
      preValidation: validateRequest({ params: serviceParamsSchema }),
    },
    servicesController.getById,
  );

  app.put<{ Params: ServiceParamsDto; Body: ServiceRequestDto }>(
    "/:id",
    {
      preValidation: validateRequest({ params: serviceParamsSchema, body: serviceBodySchema }),
    },
    servicesController.update,
  );

  app.delete<{ Params: ServiceParamsDto }>(
    "/:id",
    {
      preValidation: validateRequest({ params: serviceParamsSchema }),
    },
    servicesController.remove,
  );
}
