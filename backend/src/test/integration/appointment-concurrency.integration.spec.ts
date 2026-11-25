import { FastifyInstance } from "fastify";
import { buildApp } from "../../app/app";
import { prisma } from "../../lib/prisma";
import { createAuthenticatedUser } from "../helpers/auth-flow";
import { disconnectDatabase, resetDatabase } from "../helpers/database";
import { parseJson } from "../helpers/http";

// KAN-77: a checagem de conflito e a escrita precisam ser atômicas por recurso.
async function setupAgenda(app: FastifyInstance) {
  const { token } = await createAuthenticatedUser(app);
  const headers = { authorization: `Bearer ${token}` };

  const professionals = await app.inject({
    method: "GET",
    url: "/api/v1/professionals?page=1&limit=10&status=ativo",
    headers,
  });
  const professionalId = parseJson<{ data: Array<{ id: string }> }>(professionals.body).data[0]!.id;
  const client = await app.inject({
    method: "POST",
    url: "/api/v1/clients",
    headers,
    payload: { name: "Cliente Disputa", phone: "(11) 97777-0000" },
  });
  const service = await app.inject({
    method: "POST",
    url: "/api/v1/services",
    headers,
    payload: { name: "Limpeza", price: 120, durationMinutes: 60, active: true },
  });

  const payloadAt = (hoursFromNow: number) => {
    const scheduledAt = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
    scheduledAt.setUTCMinutes(0, 0, 0);
    return {
      clientId: parseJson<{ data: { id: string } }>(client.body).data.id,
      serviceId: parseJson<{ data: { id: string } }>(service.body).data.id,
      professionalId,
      scheduledAt: scheduledAt.toISOString(),
      status: "SCHEDULED",
    };
  };

  return { headers, professionalId, payloadAt };
}

describe("appointment concurrency integration", () => {
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

  it("deve salvar só uma de várias criações simultâneas no mesmo horário e profissional", async () => {
    const { headers, professionalId, payloadAt } = await setupAgenda(app);
    const payload = payloadAt(72);

    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        app.inject({ method: "POST", url: "/api/v1/appointments", headers, payload }),
      ),
    );

    const statuses = responses.map((response) => response.statusCode).sort();
    expect(statuses).toEqual([201, 409, 409, 409, 409]);
    for (const response of responses.filter((r) => r.statusCode === 409)) {
      expect(parseJson<{ error: { code: string } }>(response.body).error.code).toBe("TIME_CONFLICT");
    }
    await expect(prisma.appointment.count({ where: { professionalId } })).resolves.toBe(1);
  });

  it("deve deixar só uma vencer entre criar e remarcar para o mesmo horário", async () => {
    const { headers, professionalId, payloadAt } = await setupAgenda(app);
    const existing = await app.inject({
      method: "POST",
      url: "/api/v1/appointments",
      headers,
      payload: payloadAt(72),
    });
    const existingId = parseJson<{ data: { id: string } }>(existing.body).data.id;
    const target = payloadAt(96);

    const [created, rescheduled] = await Promise.all([
      app.inject({ method: "POST", url: "/api/v1/appointments", headers, payload: target }),
      app.inject({ method: "PUT", url: `/api/v1/appointments/${existingId}`, headers, payload: target }),
    ]);

    // Vence quem pegar a trava primeiro: criou (201) e a remarcação bate (409), ou o contrário.
    const outcome = `${created.statusCode}/${rescheduled.statusCode}`;
    expect(["201/409", "409/200"]).toContain(outcome);
    await expect(
      prisma.appointment.count({ where: { professionalId, scheduledAt: new Date(target.scheduledAt) } }),
    ).resolves.toBe(1);
  });
});
