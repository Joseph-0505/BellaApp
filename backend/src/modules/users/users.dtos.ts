import { z } from "zod";
import { UserResponse } from "../../shared/mappers/user-response";
import { updateCurrentUserBodySchema } from "./users.schemas";

export type GetCurrentUserResponseDto = UserResponse;
export type UpdateCurrentUserRequestDto = z.infer<typeof updateCurrentUserBodySchema>;
export type UpdateCurrentUserResponseDto = UserResponse;
