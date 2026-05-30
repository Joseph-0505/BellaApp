import { FastifyInstance } from "fastify";
import { authenticate } from "../../shared/auth/authenticate";
import { validateRequest } from "../../shared/http/validate-request";
import { RoomParamsDto, RoomRequestDto, RoomsQueryDto } from "./rooms.dtos";
import { roomsController } from "./rooms.controller";
import { roomBodySchema, roomParamsSchema, roomsQuerySchema } from "./rooms.schemas";

export async function roomsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", authenticate);

  app.get<{ Querystring: RoomsQueryDto }>(
    "/",
    {
      preValidation: validateRequest({ query: roomsQuerySchema }),
    },
    roomsController.list,
  );

  app.post<{ Body: RoomRequestDto }>(
    "/",
    {
      preValidation: validateRequest({ body: roomBodySchema }),
    },
    roomsController.create,
  );

  app.get<{ Params: RoomParamsDto }>(
    "/:id",
    {
      preValidation: validateRequest({ params: roomParamsSchema }),
    },
    roomsController.getById,
  );

  app.put<{ Params: RoomParamsDto; Body: RoomRequestDto }>(
    "/:id",
    {
      preValidation: validateRequest({ params: roomParamsSchema, body: roomBodySchema }),
    },
    roomsController.update,
  );

  app.delete<{ Params: RoomParamsDto }>(
    "/:id",
    {
      preValidation: validateRequest({ params: roomParamsSchema }),
    },
    roomsController.remove,
  );
}
