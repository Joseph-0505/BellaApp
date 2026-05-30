jest.mock("./rooms.repository", () => ({
  roomsRepository: {
    listByUser: jest.fn(),
    countByUser: jest.fn(),
    countMonthlyAppointmentsByRoomIds: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

import { roomsRepository } from "./rooms.repository";
import { roomsService } from "./rooms.service";

const mockedRoomsRepository = roomsRepository as jest.Mocked<typeof roomsRepository>;

function makeRoom(overrides: Partial<{
  id: string;
  userId: string;
  name: string;
  color: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  return {
    id: "room-1",
    userId: "user-1",
    name: "Sala Procedimentos",
    color: "#E8D8E2",
    active: true,
    createdAt: new Date("2026-04-12T10:00:00.000Z"),
    updatedAt: new Date("2026-04-12T10:00:00.000Z"),
    ...overrides,
  };
}

describe("roomsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve listar salas com filtros, contagem mensal e paginação", async () => {
    mockedRoomsRepository.listByUser.mockResolvedValue([
      makeRoom(),
      makeRoom({ id: "room-2", name: "Sala Apoio", color: null, active: false }),
    ] as never);
    mockedRoomsRepository.countByUser.mockResolvedValue(2);
    mockedRoomsRepository.countMonthlyAppointmentsByRoomIds.mockResolvedValue(
      new Map([
        ["room-1", 3],
        ["room-2", 0],
      ]) as never,
    );

    const result = await roomsService.list("user-1", {
      page: 2,
      limit: 1,
      search: "Sala",
      active: true,
    });

    expect(mockedRoomsRepository.listByUser).toHaveBeenCalledWith({
      userId: "user-1",
      page: 2,
      limit: 1,
      search: "Sala",
      active: true,
    });
    expect(mockedRoomsRepository.countByUser).toHaveBeenCalledWith({
      userId: "user-1",
      search: "Sala",
      active: true,
    });
    expect(mockedRoomsRepository.countMonthlyAppointmentsByRoomIds).toHaveBeenCalledWith("user-1", ["room-1", "room-2"]);
    expect(result.meta).toEqual({
      page: 2,
      limit: 1,
      total: 2,
      totalPages: 2,
    });
    expect(result.data).toEqual([
      expect.objectContaining({
        id: "room-1",
        monthlyAppointments: 3,
        status: "ativo",
      }),
      expect.objectContaining({
        id: "room-2",
        monthlyAppointments: 0,
        status: "inativo",
      }),
    ]);
  });

  it("deve listar salas sem filtros opcionais", async () => {
    mockedRoomsRepository.listByUser.mockResolvedValue([] as never);
    mockedRoomsRepository.countByUser.mockResolvedValue(0);
    mockedRoomsRepository.countMonthlyAppointmentsByRoomIds.mockResolvedValue(new Map() as never);

    const result = await roomsService.list("user-1", {
      page: 1,
      limit: 10,
    });

    expect(mockedRoomsRepository.listByUser).toHaveBeenCalledWith({
      userId: "user-1",
      page: 1,
      limit: 10,
    });
    expect(mockedRoomsRepository.countByUser).toHaveBeenCalledWith({
      userId: "user-1",
    });
    expect(mockedRoomsRepository.countMonthlyAppointmentsByRoomIds).toHaveBeenCalledWith("user-1", []);
    expect(result).toEqual({
      data: [],
      meta: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    });
  });

  it("deve criar sala omitindo cor quando ela não for informada", async () => {
    mockedRoomsRepository.create.mockResolvedValue(
      makeRoom({ id: "room-3", name: "Sala Nova", color: null, active: false }) as never,
    );

    const result = await roomsService.create("user-1", {
      name: "Sala Nova",
      active: false,
    });

    expect(mockedRoomsRepository.create).toHaveBeenCalledWith({
      userId: "user-1",
      name: "Sala Nova",
      active: false,
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: "room-3",
        color: null,
        monthlyAppointments: 0,
        status: "inativo",
      }),
    );
  });

  it("deve retornar sala por id com contagem mensal", async () => {
    mockedRoomsRepository.findById.mockResolvedValue(makeRoom() as never);
    mockedRoomsRepository.countMonthlyAppointmentsByRoomIds.mockResolvedValue(new Map([["room-1", 2]]) as never);

    const result = await roomsService.getById("user-1", "room-1");

    expect(mockedRoomsRepository.findById).toHaveBeenCalledWith("user-1", "room-1");
    expect(result).toEqual(
      expect.objectContaining({
        id: "room-1",
        monthlyAppointments: 2,
      }),
    );
  });

  it("deve falhar ao buscar ou remover sala inexistente", async () => {
    mockedRoomsRepository.findById.mockResolvedValue(null);

    await expect(roomsService.getById("user-1", "missing-room")).rejects.toMatchObject({
      statusCode: 404,
      code: "RESOURCE_NOT_FOUND",
    });

    await expect(roomsService.remove("user-1", "missing-room")).rejects.toMatchObject({
      statusCode: 404,
      code: "RESOURCE_NOT_FOUND",
    });

    expect(mockedRoomsRepository.delete).not.toHaveBeenCalled();
  });

  it("deve atualizar sala existente preservando payload informado", async () => {
    mockedRoomsRepository.findById.mockResolvedValue(makeRoom({ id: "room-4" }) as never);
    mockedRoomsRepository.update.mockResolvedValue(
      makeRoom({ id: "room-4", name: "Sala Vip", color: "#D97EA4", active: true }) as never,
    );
    mockedRoomsRepository.countMonthlyAppointmentsByRoomIds.mockResolvedValue(new Map([["room-4", 1]]) as never);

    const result = await roomsService.update("user-1", "room-4", {
      name: "Sala Vip",
      color: "#D97EA4",
      active: true,
    });

    expect(mockedRoomsRepository.update).toHaveBeenCalledWith("room-4", {
      name: "Sala Vip",
      color: "#D97EA4",
      active: true,
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: "room-4",
        color: "#D97EA4",
        monthlyAppointments: 1,
      }),
    );
  });

  it("deve remover sala existente", async () => {
    mockedRoomsRepository.findById.mockResolvedValue(makeRoom({ id: "room-5" }) as never);
    mockedRoomsRepository.delete.mockResolvedValue(makeRoom({ id: "room-5" }) as never);

    await roomsService.remove("user-1", "room-5");

    expect(mockedRoomsRepository.delete).toHaveBeenCalledWith("room-5");
  });
});