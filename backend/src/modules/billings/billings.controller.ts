import { FastifyReply, FastifyRequest } from "fastify";
import { BillingParamsDto, PayBillingRequestDto } from "./billings.dtos";
import { billingsService } from "./billings.service";

export const billingsController = {
  async pay(
    request: FastifyRequest<{
      Params: BillingParamsDto;
      Body: PayBillingRequestDto;
    }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await billingsService.pay(
      request.user.userId,
      request.params.id,
      request.body,
    );
    return reply.status(200).send({ data: result });
  },
};
