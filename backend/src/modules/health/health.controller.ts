import { FastifyReply, FastifyRequest } from "fastify";
import { healthService } from "./health.service";

export const healthController = {
  async check(
    _request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await healthService.check();
    return reply.status(result.status === "ok" ? 200 : 503).send({ data: result });
  },
};
