import { FastifyReply, FastifyRequest } from "fastify";
import { ServiceParamsDto, ServiceRequestDto, ServicesQueryDto } from "./services.dtos";
import { servicesService } from "./services.service";

export const servicesController = {
  async list(
    request: FastifyRequest<{ Querystring: ServicesQueryDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await servicesService.list(request.user.userId, request.query);
    return reply.status(200).send(result);
  },

  async create(
    request: FastifyRequest<{ Body: ServiceRequestDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await servicesService.create(request.user.userId, request.body);
    return reply.status(201).send({ data: result });
  },

  async getById(
    request: FastifyRequest<{ Params: ServiceParamsDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await servicesService.getById(request.user.userId, request.params.id);
    return reply.status(200).send({ data: result });
  },

  async update(
    request: FastifyRequest<{ Params: ServiceParamsDto; Body: ServiceRequestDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await servicesService.update(request.user.userId, request.params.id, request.body);
    return reply.status(200).send({ data: result });
  },

  async remove(
    request: FastifyRequest<{ Params: ServiceParamsDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    await servicesService.remove(request.user.userId, request.params.id);
    return reply.status(204).send();
  },
};
