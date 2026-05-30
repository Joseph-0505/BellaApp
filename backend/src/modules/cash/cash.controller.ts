import { FastifyReply, FastifyRequest } from "fastify";
import {
  CashQueryDto,
  CloseCashRequestDto,
  OpenCashRequestDto,
} from "./cash.dtos";
import { cashService } from "./cash.service";

export const cashController = {
  async getToday(
    request: FastifyRequest<{ Querystring: CashQueryDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await cashService.getToday(
      request.user.userId,
      request.query.professionalId,
    );
    return reply.status(200).send({ data: result });
  },

  async openToday(
    request: FastifyRequest<{ Body: OpenCashRequestDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await cashService.openToday(
      request.user.userId,
      request.body,
    );
    return reply.status(201).send({ data: result });
  },

  async closeToday(
    request: FastifyRequest<{ Body: CloseCashRequestDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await cashService.closeToday(
      request.user.userId,
      request.body,
    );
    return reply.status(200).send({ data: result });
  },
};
