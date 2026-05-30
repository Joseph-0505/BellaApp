import { FastifyReply, FastifyRequest } from "fastify";
import { usersService } from "./users.service";
import { UpdateCurrentUserRequestDto } from "./users.dtos";

export const usersController = {
  async getCurrentUser(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const result = await usersService.getCurrentUser(request.user.userId);
    return reply.status(200).send({ data: result });
  },

  async updateCurrentUser(
    request: FastifyRequest<{ Body: UpdateCurrentUserRequestDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await usersService.updateCurrentUser(request.user.userId, request.body);
    return reply.status(200).send({ data: result });
  },
};
