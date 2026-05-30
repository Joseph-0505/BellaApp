import { FastifyReply, FastifyRequest } from "fastify";
import { appointmentsService } from "./appointments.service";
import {
  AppointmentParamsDto,
  AppointmentRequestDto,
  AppointmentsQueryDto,
  CompleteAppointmentRequestDto,
} from "./appointments.dtos";

export const appointmentsController = {
  async list(
    request: FastifyRequest<{ Querystring: AppointmentsQueryDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await appointmentsService.list(
      request.user.userId,
      request.query,
    );
    return reply.status(200).send(result);
  },

  async create(
    request: FastifyRequest<{ Body: AppointmentRequestDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await appointmentsService.create(
      request.user.userId,
      request.body,
    );
    return reply.status(201).send({ data: result });
  },

  async getById(
    request: FastifyRequest<{ Params: AppointmentParamsDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await appointmentsService.getById(
      request.user.userId,
      request.params.id,
    );
    return reply.status(200).send({ data: result });
  },

  async complete(
    request: FastifyRequest<{
      Params: AppointmentParamsDto;
      Body: CompleteAppointmentRequestDto;
    }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await appointmentsService.complete(
      request.user.userId,
      request.params.id,
      request.body,
    );
    return reply.status(200).send({ data: result });
  },

  async update(
    request: FastifyRequest<{
      Params: AppointmentParamsDto;
      Body: AppointmentRequestDto;
    }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await appointmentsService.update(
      request.user.userId,
      request.params.id,
      request.body,
    );
    return reply.status(200).send({ data: result });
  },

  async remove(
    request: FastifyRequest<{ Params: AppointmentParamsDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    await appointmentsService.remove(request.user.userId, request.params.id);
    return reply.status(204).send();
  },
};
