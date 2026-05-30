import { FastifyReply, FastifyRequest } from "fastify";
import { RoomParamsDto, RoomRequestDto, RoomsQueryDto } from "./rooms.dtos";
import { roomsService } from "./rooms.service";

export const roomsController = {
  async list(
    request: FastifyRequest<{ Querystring: RoomsQueryDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await roomsService.list(request.user.userId, request.query);
    return reply.status(200).send(result);
  },

  async create(
    request: FastifyRequest<{ Body: RoomRequestDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await roomsService.create(request.user.userId, request.body);
    return reply.status(201).send({ data: result });
  },

  async getById(
    request: FastifyRequest<{ Params: RoomParamsDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await roomsService.getById(request.user.userId, request.params.id);
    return reply.status(200).send({ data: result });
  },

  async update(
    request: FastifyRequest<{ Params: RoomParamsDto; Body: RoomRequestDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await roomsService.update(request.user.userId, request.params.id, request.body);
    return reply.status(200).send({ data: result });
  },

  async remove(
    request: FastifyRequest<{ Params: RoomParamsDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    await roomsService.remove(request.user.userId, request.params.id);
    return reply.status(204).send();
  },
};
