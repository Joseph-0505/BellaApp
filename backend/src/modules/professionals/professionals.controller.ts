import { FastifyReply, FastifyRequest } from "fastify";
import {
  CreateProfessionalRequestDto,
  InviteProfessionalRequestDto,
  ProfessionalParamsDto,
  ProfessionalsQueryDto,
  UpdateProfessionalRequestDto,
} from "./professionals.dtos";
import { professionalsService } from "./professionals.service";

export const professionalsController = {
  async list(
    request: FastifyRequest<{ Querystring: ProfessionalsQueryDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await professionalsService.list(request.user.userId, request.query);
    return reply.status(200).send(result);
  },

  async create(
    request: FastifyRequest<{ Body: CreateProfessionalRequestDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await professionalsService.create(request.user.userId, request.body);
    return reply.status(201).send({ data: result });
  },

  async invite(
    request: FastifyRequest<{ Body: InviteProfessionalRequestDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await professionalsService.invite(request.user.userId, request.body);
    return reply.status(201).send({ data: result });
  },

  async resendInvite(
    request: FastifyRequest<{ Params: ProfessionalParamsDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await professionalsService.resendInvite(request.user.userId, request.params.id);
    return reply.status(200).send({ data: result });
  },

  async getById(
    request: FastifyRequest<{ Params: ProfessionalParamsDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await professionalsService.getById(request.user.userId, request.params.id);
    return reply.status(200).send({ data: result });
  },

  async update(
    request: FastifyRequest<{ Params: ProfessionalParamsDto; Body: UpdateProfessionalRequestDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await professionalsService.update(request.user.userId, request.params.id, request.body);
    return reply.status(200).send({ data: result });
  },

  async remove(
    request: FastifyRequest<{ Params: ProfessionalParamsDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    await professionalsService.remove(request.user.userId, request.params.id);
    return reply.status(204).send();
  },
};
