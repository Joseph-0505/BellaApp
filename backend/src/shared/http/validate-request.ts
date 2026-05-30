import { FastifyRequest } from "fastify";
import { ZodType } from "zod";

type RequestSchemas<TBody, TParams, TQuery> = {
  body?: ZodType<TBody>;
  params?: ZodType<TParams>;
  query?: ZodType<TQuery>;
};

type MutableRequest<TBody, TParams, TQuery> = FastifyRequest<{
  Body: TBody;
  Params: TParams;
  Querystring: TQuery;
}>;

// Aplica os schemas do Zod na request e devolve os valores já normalizados para o restante da rota.
export function validateRequest<
  TBody = FastifyRequest["body"],
  TParams = FastifyRequest["params"],
  TQuery = FastifyRequest["query"],
>(
  schemas: RequestSchemas<TBody, TParams, TQuery>,
): (request: FastifyRequest) => Promise<void> {
  return async function validationHook(request: FastifyRequest): Promise<void> {
    const mutableRequest = request as MutableRequest<TBody, TParams, TQuery>;

    if (schemas.body) {
      mutableRequest.body = await schemas.body.parseAsync(request.body);
    }

    if (schemas.params) {
      mutableRequest.params = await schemas.params.parseAsync(request.params);
    }

    if (schemas.query) {
      mutableRequest.query = await schemas.query.parseAsync(request.query);
    }
  };
}
