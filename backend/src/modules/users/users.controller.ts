import { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../../shared/errors/app-error";
import type { UploadedProfileImage } from "../../shared/uploads/profile-image";
import { usersService } from "./users.service";
import {
  DeleteCurrentUserRequestDto,
  UpdateCurrentUserRequestDto,
} from "./users.dtos";

type ProfileImageRequest = FastifyRequest & {
  file?: Partial<UploadedProfileImage>;
};

export const usersController = {
  async getCurrentUser(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const result = await usersService.getCurrentUser(request.user.userId);
    return reply.status(200).send({ data: result });
  },

  async updateCurrentUser(
    request: FastifyRequest<{ Body: UpdateCurrentUserRequestDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await usersService.updateCurrentUser(request.user.userId, request.body);
    return reply.status(200).send({ data: result });
  },

  async updateCurrentUserAvatar(
    request: ProfileImageRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const file = request.file;

    if (
      !file?.filename
      || !file.mimetype
      || !file.originalname
      || !file.path
      || typeof file.size !== "number"
    ) {
      throw new AppError(400, "PROFILE_IMAGE_REQUIRED", "Selecione uma imagem para enviar.");
    }

    const result = await usersService.updateCurrentUserAvatar(
      request.user.userId,
      file as UploadedProfileImage,
    );

    return reply.status(200).send({ data: result });
  },

  async removeCurrentUserAvatar(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const result = await usersService.removeCurrentUserAvatar(request.user.userId);
    return reply.status(200).send({ data: result });
  },

  async deleteCurrentUser(
    request: FastifyRequest<{ Body: DeleteCurrentUserRequestDto }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    await usersService.deleteCurrentUser(request.user.userId, request.body);
    return reply.status(204).send();
  },
};
