import { FastifyInstance } from "fastify";
import { authenticate } from "../../shared/auth/authenticate";
import { validateRequest } from "../../shared/http/validate-request";
import { onboardingController } from "./onboarding.controller";
import { CompleteOnboardingRequestDto } from "./onboarding.dtos";
import { completeOnboardingBodySchema } from "./onboarding.schemas";

export async function onboardingRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", authenticate);

  app.get("/status", onboardingController.getStatus);

  app.post<{ Body: CompleteOnboardingRequestDto }>(
    "/complete",
    {
      preValidation: validateRequest({ body: completeOnboardingBodySchema }),
    },
    onboardingController.complete,
  );
}
