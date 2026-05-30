import { ClinicPlan } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../errors/app-error";
import { isTrialActive, userClinicContextService } from "./user-clinic-context";

function trialExpiredError(): AppError {
  return new AppError(
    403,
    "TRIAL_EXPIRED",
    "Seu periodo de teste expirou. Faca upgrade para continuar.",
  );
}

export async function requireActivePlan(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  if (request.method === "OPTIONS") {
    return;
  }

  const context = await userClinicContextService.getOrThrow(
    request.user.userId,
  );

  if (context.plan === ClinicPlan.TRIAL && !isTrialActive(context)) {
    throw trialExpiredError();
  }
}
