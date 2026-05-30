import { FastifyReply, FastifyRequest } from "fastify";
import { ClientParamsDto, ClientRequestDto, ClientsQueryDto } from "./clients.dtos";
import { clientsService } from "./clients.service";

export const clientsController = {
  async list(
    request: FastifyRequest<{ Querystring: ClientsQueryDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await clientsService.list(request.user.userId, request.query);
    return reply.status(200).send(result);
  },

  async create(
    request: FastifyRequest<{ Body: ClientRequestDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await clientsService.create(request.user.userId, request.body);
    return reply.status(201).send({ data: result });
  },

  async getById(
    request: FastifyRequest<{ Params: ClientParamsDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await clientsService.getById(request.user.userId, request.params.id);
    return reply.status(200).send({ data: result });
  },

  async update(
    request: FastifyRequest<{ Params: ClientParamsDto; Body: ClientRequestDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await clientsService.update(request.user.userId, request.params.id, request.body);
    return reply.status(200).send({ data: result });
  },

  async remove(
    request: FastifyRequest<{ Params: ClientParamsDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    await clientsService.remove(request.user.userId, request.params.id);
    return reply.status(204).send();
  },
};
