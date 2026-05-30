import { FastifyInstance } from "fastify";
import { authenticate } from "../../shared/auth/authenticate";
import { validateRequest } from "../../shared/http/validate-request";
import {
  CashQueryDto,
  CloseCashRequestDto,
  OpenCashRequestDto,
} from "./cash.dtos";
import { cashController } from "./cash.controller";
import {
  cashQuerySchema,
  closeCashBodySchema,
  openCashBodySchema,
} from "./cash.schemas";

export async function cashRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", authenticate);

  app.get<{ Querystring: CashQueryDto }>(
    "/",
    {
      preValidation: validateRequest({
        query: cashQuerySchema,
      }),
    },
    cashController.getToday,
  );

  app.post<{ Body: OpenCashRequestDto }>(
    "/abrir",
    {
      preValidation: validateRequest({
        body: openCashBodySchema,
      }),
    },
    cashController.openToday,
  );

  app.post<{ Body: CloseCashRequestDto }>(
    "/fechar",
    {
      preValidation: validateRequest({
        body: closeCashBodySchema,
      }),
    },
    cashController.closeToday,
  );
}
