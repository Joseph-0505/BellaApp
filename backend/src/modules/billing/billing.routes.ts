import { FastifyInstance } from "fastify";
import { authenticate } from "../../shared/auth/authenticate";
import { validateRequest } from "../../shared/http/validate-request";
import { UpgradePlanRequestDto } from "./billing.dtos";
import { billingController } from "./billing.controller";
import { upgradePlanBodySchema } from "./billing.schemas";

export async function billingRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", authenticate);

  app.get("/", billingController.getCurrentPlan);

  app.post<{ Body: UpgradePlanRequestDto }>(
    "/upgrade",
    {
      preValidation: validateRequest({ body: upgradePlanBodySchema }),
    },
    billingController.upgradePlan,
  );
}
