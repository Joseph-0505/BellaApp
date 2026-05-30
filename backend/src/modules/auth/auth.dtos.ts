import { z } from "zod";
import { UserResponse } from "../../shared/mappers/user-response";
import {
  activateBodySchema,
  activationQuerySchema,
  loginBodySchema,
  logoutBodySchema,
  refreshTokenBodySchema,
  registerBodySchema,
} from "./auth.schemas";

export type RegisterRequestDto = z.infer<typeof registerBodySchema>;
export type LoginRequestDto = z.infer<typeof loginBodySchema>;
export type LogoutRequestDto = z.infer<typeof logoutBodySchema>;
export type RefreshTokenRequestDto = z.infer<typeof refreshTokenBodySchema>;
export type ActivationQueryDto = z.infer<typeof activationQuerySchema>;
export type ActivateAccountRequestDto = z.infer<typeof activateBodySchema>;

export type RegisterResponseDto = UserResponse;
export type RefreshTokenResponseDto = LoginResponseDto;

export type LoginResponseDto = {
  token: string;
  refreshToken: string;
  expiresIn: string;
  refreshTokenExpiresIn: string;
  user: UserResponse;
};

export type ActivationStatusResponseDto = {
  clinicName: string;
  email: string;
  name: string;
};

export type ActivateAccountResponseDto = {
  email: string;
  name: string;
};
