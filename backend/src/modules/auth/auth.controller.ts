import { FastifyReply, FastifyRequest } from "fastify";
import {
  ActivateAccountRequestDto,
  ActivationQueryDto,
  LoginRequestDto,
  LogoutRequestDto,
  RefreshTokenRequestDto,
  RegisterRequestDto,
} from "./auth.dtos";
import { authService } from "./auth.service";

export const authController = {
  async register(
    request: FastifyRequest<{ Body: RegisterRequestDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await authService.register(request.body);
    return reply.status(201).send({ data: result });
  },

  async login(
    request: FastifyRequest<{ Body: LoginRequestDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await authService.login(request.body);
    return reply.status(200).send({ data: result });
  },

  async logout(
    request: FastifyRequest<{ Body: LogoutRequestDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const { refreshToken } = request.body;

    await authService.logout(refreshToken);

    return reply.status(200).send({
      data: { message: "Logout realizado com sucesso" },
    });
  },

  async refresh(
    request: FastifyRequest<{ Body: RefreshTokenRequestDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await authService.refresh(request.body);
    return reply.status(200).send({ data: result });
  },

  async getActivationStatus(
    request: FastifyRequest<{ Querystring: ActivationQueryDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await authService.getActivationStatus(request.query.token);
    return reply.status(200).send({ data: result });
  },

  async activate(
    request: FastifyRequest<{ Body: ActivateAccountRequestDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await authService.activateAccount(request.body);
    return reply.status(200).send({ data: result });
  },
};
