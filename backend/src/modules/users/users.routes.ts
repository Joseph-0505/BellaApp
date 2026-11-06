import { FastifyInstance } from "fastify";
import { authenticate } from "../../shared/auth/authenticate";
import { validateRequest } from "../../shared/http/validate-request";
import { receiveProfileImage } from "../../shared/uploads/profile-image";
import {
  DeleteCurrentUserRequestDto,
  UpdateCurrentUserRequestDto,
} from "./users.dtos";
import {
  deleteCurrentUserBodySchema,
  updateCurrentUserBodySchema,
} from "./users.schemas";
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

  app.post(
    "/me/avatar",
    { preHandler: receiveProfileImage },
    usersController.updateCurrentUserAvatar,
  );

  app.delete("/me/avatar", usersController.removeCurrentUserAvatar);

  app.delete<{ Body: DeleteCurrentUserRequestDto }>(
    "/me",
    {
      preValidation: validateRequest({ body: deleteCurrentUserBodySchema }),
    },
    usersController.deleteCurrentUser,
  );
}
