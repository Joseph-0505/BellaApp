import { FastifyInstance } from "fastify";
import { authenticate } from "../../shared/auth/authenticate";
import { validateRequest } from "../../shared/http/validate-request";
import { UpdateCurrentUserRequestDto } from "./users.dtos";
import { updateCurrentUserBodySchema } from "./users.schemas";
import { usersController } from "./users.controller";

export async function usersRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", authenticate);

  app.get(
    "/me",
    usersController.getCurrentUser,
  );

  app.put<{ Body: UpdateCurrentUserRequestDto }>(
    "/me",
    {
      preValidation: validateRequest({ body: updateCurrentUserBodySchema }),
    },
    usersController.updateCurrentUser,
  );
}
