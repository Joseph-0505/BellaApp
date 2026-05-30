import { FastifyReply, FastifyRequest } from "fastify";
import { UpgradePlanRequestDto } from "./billing.dtos";
import { billingService } from "./billing.service";

export const billingController = {
  async getCurrentPlan(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await billingService.getCurrentPlan(request.user.userId);
    return reply.status(200).send({ data: result });
  },

  async upgradePlan(
    request: FastifyRequest<{ Body: UpgradePlanRequestDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await billingService.upgradePlan(
      request.user.userId,
      request.body,
    );
    return reply.status(200).send({ data: result });
  },
};
