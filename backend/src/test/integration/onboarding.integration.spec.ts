import { FastifyInstance } from "fastify";
import { buildApp } from "../../app/app";
import { prisma } from "../../lib/prisma";
import { createAuthenticatedUser } from "../helpers/auth-flow";
import { disconnectDatabase, resetDatabase } from "../helpers/database";
import { parseJson } from "../helpers/http";

describe("onboarding integration", () => {
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

  it("deve exigir autenticacao e validar o payload do onboarding", async () => {
    const unauthorizedResponse = await app.inject({
      method: "GET",
      url: "/api/v1/onboarding/status",
    });

    const unauthorizedBody = parseJson<{ error: { code: string } }>(
      unauthorizedResponse.body,
    );

    expect(unauthorizedResponse.statusCode).toBe(401);
    expect(unauthorizedBody.error.code).toBe("INVALID_TOKEN");

    const authenticated = await createAuthenticatedUser(app);

    const invalidResponse = await app.inject({
      method: "POST",
      url: "/api/v1/onboarding/complete",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
      payload: {},
    });

    const invalidBody = parseJson<{
      error: {
        code: string;
        details?: Array<{ path: string; message: string }>;
      };
    }>(invalidResponse.body);

    expect(invalidResponse.statusCode).toBe(400);
    expect(invalidBody.error.code).toBe("VALIDATION_ERROR");
    expect(invalidBody.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: "businessName" })]),
    );
  });

  it("deve retornar o status inicial incompleto para um usuario novo", async () => {
    const authenticated = await createAuthenticatedUser(app);

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/onboarding/status",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
    });

    const body = parseJson<{
      data: {
        completed: boolean;
        businessName: string;
        hasTeam: boolean;
        usesRooms: boolean;
        servicesCount: number;
        professionalsCount: number;
        roomsCount: number;
        defaultSchedule: {
          mondayToFriday: { start: string; end: string };
          saturday: { start: string; end: string };
          sunday: { closed: true };
        };
      };
    }>(response.body);

    expect(response.statusCode).toBe(200);
    expect(body.data).toEqual({
      completed: false,
      businessName: "",
      hasTeam: false,
      usesRooms: false,
      servicesCount: 0,
      professionalsCount: 1,
      roomsCount: 0,
      defaultSchedule: {
        mondayToFriday: { start: "08:00", end: "18:00" },
        saturday: { start: "08:00", end: "12:00" },
        sunday: { closed: true },
      },
    });
  });

  it("deve concluir o onboarding minimo e redirecionar o setup restante para dentro do produto", async () => {
    const authenticated = await createAuthenticatedUser(app, {
      name: "Mauro Felix",
      email: "mauro@bella.com",
    });

    const firstResponse = await app.inject({
      method: "POST",
      url: "/api/v1/onboarding/complete",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
      payload: {
        businessName: "Bella Clinic",
      },
    });

    const firstBody = parseJson<{
      data: {
        completed: boolean;
        businessName: string;
        hasTeam: boolean;
        usesRooms: boolean;
        servicesCount: number;
        professionalsCount: number;
        roomsCount: number;
        created: {
          professional: boolean;
          services: string[];
          rooms: string[];
        };
      };
    }>(firstResponse.body);

    expect(firstResponse.statusCode).toBe(200);
    expect(firstBody.data).toMatchObject({
      completed: true,
      businessName: "Bella Clinic",
      hasTeam: false,
      usesRooms: false,
      servicesCount: 0,
      professionalsCount: 1,
      roomsCount: 0,
      created: {
        professional: false,
        services: [],
        rooms: [],
      },
    });

    const secondResponse = await app.inject({
      method: "POST",
      url: "/api/v1/onboarding/complete",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
      payload: {
        businessName: "Bella Prime",
      },
    });

    const secondBody = parseJson<{
      data: {
        completed: boolean;
        businessName: string;
        hasTeam: boolean;
        usesRooms: boolean;
        servicesCount: number;
        professionalsCount: number;
        roomsCount: number;
        created: {
          professional: boolean;
          services: string[];
          rooms: string[];
        };
      };
    }>(secondResponse.body);

    expect(secondResponse.statusCode).toBe(200);
    expect(secondBody.data).toMatchObject({
      completed: true,
      businessName: "Bella Prime",
      hasTeam: false,
      usesRooms: false,
      servicesCount: 0,
      professionalsCount: 1,
      roomsCount: 0,
      created: {
        professional: false,
        services: [],
        rooms: [],
      },
    });

    const finalStatusResponse = await app.inject({
      method: "GET",
      url: "/api/v1/onboarding/status",
      headers: {
        authorization: `Bearer ${authenticated.token}`,
      },
    });

    const finalStatusBody = parseJson<{
      data: {
        completed: boolean;
        businessName: string;
        hasTeam: boolean;
        usesRooms: boolean;
        servicesCount: number;
        professionalsCount: number;
        roomsCount: number;
      };
    }>(finalStatusResponse.body);

    const persistedUser = await prisma.user.findUniqueOrThrow({
      where: {
        id: authenticated.userId,
      },
      include: {
        businessProfile: true,
      },
    });
    const servicesCount = await prisma.service.count({
      where: {
        userId: authenticated.userId,
      },
    });
    const roomsCount = await prisma.room.count({
      where: {
        userId: authenticated.userId,
      },
    });
    const professionalsCount = await prisma.professional.count({
      where: {
        userId: authenticated.userId,
      },
    });

    expect(finalStatusResponse.statusCode).toBe(200);
    expect(finalStatusBody.data).toMatchObject({
      completed: true,
      businessName: "Bella Prime",
      hasTeam: false,
      usesRooms: false,
      servicesCount: 0,
      professionalsCount: 1,
      roomsCount: 0,
    });
    expect(persistedUser.businessProfile).toMatchObject({
      businessName: "Bella Prime",
      hasTeam: false,
      usesRooms: false,
    });
    expect(persistedUser.businessProfile?.onboardingCompletedAt).not.toBeNull();
    expect(servicesCount).toBe(0);
    expect(roomsCount).toBe(0);
    expect(professionalsCount).toBe(1);
  });
});
