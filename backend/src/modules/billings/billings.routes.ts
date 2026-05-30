import { FastifyInstance } from "fastify";
import { authenticate } from "../../shared/auth/authenticate";
import { validateRequest } from "../../shared/http/validate-request";
import { BillingParamsDto, PayBillingRequestDto } from "./billings.dtos";
import { billingsController } from "./billings.controller";
import { billingParamsSchema, payBillingBodySchema } from "./billings.schemas";

export async function billingsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", authenticate);

  app.post<{ Params: BillingParamsDto; Body: PayBillingRequestDto }>(
    "/:id/pagar",
    {
      preValidation: validateRequest({
        params: billingParamsSchema,
        body: payBillingBodySchema,
      }),
    },
    billingsController.pay,
  );
}
