import { FastifyInstance } from "fastify";

import { openStoredProfileImage } from "../../shared/uploads/profile-image";

type ProfileImageParams = {
  fileName: string;
};

export async function profileImagesRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: ProfileImageParams }>("/:fileName", async (request, reply) => {
    const image = await openStoredProfileImage(request.params.fileName);

    return reply
      .header("Cache-Control", "public, max-age=31536000, immutable")
      .header("X-Content-Type-Options", "nosniff")
      .type(image.contentType)
      .send(image.stream);
  });
}
