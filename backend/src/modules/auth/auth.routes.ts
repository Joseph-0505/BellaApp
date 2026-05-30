import { FastifyInstance } from "fastify";
import { validateRequest } from "../../shared/http/validate-request";
import {
  ActivateAccountRequestDto,
  ActivationQueryDto,
  LoginRequestDto,
  LogoutRequestDto,
  RefreshTokenRequestDto,
  RegisterRequestDto,
} from "./auth.dtos";
import { authController } from "./auth.controller";
import {
  activateBodySchema,
  activationQuerySchema,
  loginBodySchema,
  logoutBodySchema,
  refreshTokenBodySchema,
  registerBodySchema,
} from "./auth.schemas";

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: RegisterRequestDto }>(
    "/register",
    {
      preValidation: validateRequest({ body: registerBodySchema }),
    },
    authController.register,
  );

  app.post<{ Body: LoginRequestDto }>(
    "/login",
    {
      preValidation: validateRequest({ body: loginBodySchema }),
    },
    authController.login,
  );

  app.post<{ Body: LogoutRequestDto }>(
    "/logout",
    {
      preValidation: validateRequest({
        body: logoutBodySchema,
      }),
    },
    authController.logout,
  );

  app.post<{ Body: RefreshTokenRequestDto }>(
    "/refresh",
    {
      preValidation: validateRequest({
        body: refreshTokenBodySchema,
      }),
    },
    authController.refresh,
  );

  app.get<{ Querystring: ActivationQueryDto }>(
    "/activation",
    {
      preValidation: validateRequest({
        query: activationQuerySchema,
      }),
    },
    authController.getActivationStatus,
  );

  app.post<{ Body: ActivateAccountRequestDto }>(
    "/activate",
    {
      preValidation: validateRequest({
        body: activateBodySchema,
      }),
    },
    authController.activate,
  );
}
