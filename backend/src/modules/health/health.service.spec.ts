const mockPrisma = {
  $queryRaw: jest.fn(),
};
const mockPingRedis = jest.fn();

jest.mock("../../lib/prisma", () => ({ prisma: mockPrisma }));
jest.mock("../../lib/redis", () => ({ pingRedis: mockPingRedis }));

import { healthService } from "./health.service";

describe("healthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);
    mockPingRedis.mockResolvedValue("PONG");
  });

  it("retorna ok quando as dependencias respondem", async () => {
    const result = await healthService.check();

    expect(result.status).toBe("ok");
    expect(result.dependencies.mysql.status).toBe("up");
  });

  it("retorna down quando o MySQL falha", async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error("database unavailable"));

    const result = await healthService.check();

    expect(result.status).toBe("down");
    expect(result.dependencies.mysql.status).toBe("down");
  });
});
