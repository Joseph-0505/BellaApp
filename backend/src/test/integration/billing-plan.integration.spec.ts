import { FastifyInstance } from "fastify";
import { buildApp } from "../../app/app";
import { prisma } from "../../lib/prisma";
import { createAuthenticatedUser } from "../helpers/auth-flow";
import { disconnectDatabase, resetDatabase } from "../helpers/database";
import { parseJson } from "../helpers/http";

describe("billing plan integration", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await app.close();
    await disconnectDatabase();
  });

  it("deve criar conta com plano TRIAL e permitir upgrade para TEAM", async () => {
    const authenticated = await createAuthenticatedUser(app);

    const currentPlanResponse = await app.inject({
      method: "GET",
      url: "/api/v1/billing",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
    });

    const currentPlanBody = parseJson<{
      data: {
        plan: string;
        trialEndsAt: string | null;
      };
    }>(currentPlanResponse.body);

    expect(currentPlanResponse.statusCode).toBe(200);
    expect(currentPlanBody.data.plan).toBe("TRIAL");
    expect(currentPlanBody.data.trialEndsAt).not.toBeNull();

    const upgradeResponse = await app.inject({
      method: "POST",
      url: "/api/v1/billing/upgrade",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
      payload: {
        plan: "TEAM",
      },
    });

    const upgradeBody = parseJson<{
      data: {
        plan: string;
        trialEndsAt: string | null;
      };
    }>(upgradeResponse.body);

    expect(upgradeResponse.statusCode).toBe(200);
    expect(upgradeBody.data).toEqual({
      plan: "TEAM",
      trialEndsAt: null,
    });
  });

  it("deve bloquear criação de cliente quando trial estiver expirado", async () => {
    const authenticated = await createAuthenticatedUser(app);

    await prisma.clinic.updateMany({
      data: {
        plan: "TRIAL",
        trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/clients",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
      payload: {
        name: "Cliente Teste",
        phone: "11999999999",
      },
    });

    const body = parseJson<{
      error: {
        code: string;
        message: string;
      };
    }>(response.body);

    expect(response.statusCode).toBe(403);
    expect(body.error.code).toBe("TRIAL_EXPIRED");
  });
});
