jest.mock("./clients.repository", () => ({
  clientsRepository: {
    listByUser: jest.fn(),
    countByUser: jest.fn(),
    listAppointmentActivityByClientIds: jest.fn(),
    findByCpf: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

import { AppointmentStatus } from "@prisma/client";
import { clientsRepository } from "./clients.repository";
import { clientsService } from "./clients.service";

const mockedClientsRepository = clientsRepository as jest.Mocked<typeof clientsRepository>;

describe("clientsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve normalizar CPF e bloquear duplicidade por usuário no cadastro", async () => {
    mockedClientsRepository.findByCpf.mockResolvedValue({
      id: "client-existing",
    } as never);

    await expect(
      clientsService.create("user-1", {
        name: "Fernanda",
        phone: "(11) 99999-9999",
        cpf: "123.456.789-09",
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "CPF_ALREADY_EXISTS",
    });

    expect(mockedClientsRepository.findByCpf).toHaveBeenCalledWith("user-1", "12345678909");
  });

  it("deve enriquecer a listagem com histórico, próximo agendamento e total gasto", async () => {
    const latestVisitAt = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const nextAppointmentAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    mockedClientsRepository.listByUser.mockResolvedValue([
      {
        id: "client-1",
        userId: "user-1",
        name: "Fernanda",
        email: "fernanda@bella.com",
        phone: "(11) 99999-9999",
        cpf: "12345678909",
        notes: "Prefere horário da tarde",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as never);
    mockedClientsRepository.countByUser.mockResolvedValue(1);
    mockedClientsRepository.listAppointmentActivityByClientIds.mockResolvedValue([
      {
        clientId: "client-1",
        scheduledAt: nextAppointmentAt,
        status: AppointmentStatus.CONFIRMED,
        notes: null,
        professional: {
          name: "Dra. Beatriz",
        },
        service: {
          name: "Laser",
          price: 200,
        },
      },
      {
        clientId: "client-1",
        scheduledAt: latestVisitAt,
        status: AppointmentStatus.COMPLETED,
        notes: "Retorno concluído com sucesso",
        professional: {
          name: "Dra. Ana",
        },
        service: {
          name: "Limpeza de Pele",
          price: 150,
        },
      },
    ] as never);

    const result = await clientsService.list("user-1", {
      page: 1,
      limit: 10,
      search: undefined,
    });

    expect(result.meta.total).toBe(1);
    expect(result.data[0]).toEqual({
      id: "client-1",
      name: "Fernanda",
      email: "fernanda@bella.com",
      phone: "(11) 99999-9999",
      cpf: "12345678909",
      notes: "Prefere horário da tarde",
      latestVisitAt: latestVisitAt.toISOString(),
      latestVisitNote: "Retorno concluído com sucesso",
      nextAppointmentAt: nextAppointmentAt.toISOString(),
      professional: "Dra. Beatriz",
      totalSpent: 150,
      status: "ativo",
    });
  });

  it("deve retornar status novo quando cliente ainda não possui atendimentos", async () => {
    mockedClientsRepository.findById.mockResolvedValue({
      id: "client-2",
      userId: "user-1",
      name: "Cliente Novo",
      email: null,
      phone: "(11) 98888-7777",
      cpf: null,
      notes: "Primeiro contato",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    mockedClientsRepository.listAppointmentActivityByClientIds.mockResolvedValue([]);

    const result = await clientsService.getById("user-1", "client-2");

    expect(result.status).toBe("novo");
    expect(result.latestVisitAt).toBeNull();
    expect(result.latestVisitNote).toBe("Primeiro contato");
    expect(result.nextAppointmentAt).toBeNull();
    expect(result.totalSpent).toBe(0);
  });
});
