import { FastifyReply, FastifyRequest } from "fastify";
import { CompleteOnboardingRequestDto } from "./onboarding.dtos";
import { onboardingService } from "./onboarding.service";

export const onboardingController = {
  async getStatus(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const result = await onboardingService.getStatus(request.user.userId);
    return reply.status(200).send({ data: result });
  },

  async complete(
    request: FastifyRequest<{ Body: CompleteOnboardingRequestDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await onboardingService.complete(request.user.userId, request.body);
    return reply.status(200).send({ data: result });
  },
};
