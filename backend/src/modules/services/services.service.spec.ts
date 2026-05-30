jest.mock("./services.repository", () => ({
  servicesRepository: {
    listByUser: jest.fn(),
    countByUser: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    countSoldByServiceIds: jest.fn(),
    countSoldByServiceId: jest.fn(),
  },
}));

import { ServiceRiskLevel } from "@prisma/client";
import { servicesRepository } from "./services.repository";
import { servicesService } from "./services.service";

const mockedServicesRepository = servicesRepository as jest.Mocked<typeof servicesRepository>;

describe("servicesService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve listar serviços com filtros, paginação e contagem de vendas", async () => {
    mockedServicesRepository.listByUser.mockResolvedValue([
      {
        id: "service-1",
        userId: "user-1",
        name: "Laser",
        description: "Tratamento a laser",
        price: 250,
        durationMinutes: 60,
        riskLevel: ServiceRiskLevel.HIGH,
        iconKey: "wand",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as never);
    mockedServicesRepository.countByUser.mockResolvedValue(1);
    mockedServicesRepository.countSoldByServiceIds.mockResolvedValue([
      {
        serviceId: "service-1",
        _count: {
          _all: 3,
        },
      },
    ] as never);

    const result = await servicesService.list("user-1", {
      page: 1,
      limit: 10,
      search: "Laser",
      active: true,
      risk: "alto",
      minDurationMinutes: 30,
      maxDurationMinutes: 90,
      minPrice: 100,
      maxPrice: 500,
    });

    expect(mockedServicesRepository.listByUser).toHaveBeenCalledWith({
      userId: "user-1",
      page: 1,
      limit: 10,
      filters: {
        search: "Laser",
        active: true,
        riskLevel: ServiceRiskLevel.HIGH,
        minDurationMinutes: 30,
        maxDurationMinutes: 90,
        minPrice: 100,
        maxPrice: 500,
      },
    });
    expect(mockedServicesRepository.countByUser).toHaveBeenCalledWith({
      userId: "user-1",
      filters: {
        search: "Laser",
        active: true,
        riskLevel: ServiceRiskLevel.HIGH,
        minDurationMinutes: 30,
        maxDurationMinutes: 90,
        minPrice: 100,
        maxPrice: 500,
      },
    });
    expect(mockedServicesRepository.countSoldByServiceIds).toHaveBeenCalledWith("user-1", ["service-1"]);
    expect(result).toEqual({
      data: [
        {
          id: "service-1",
          name: "Laser",
          description: "Tratamento a laser",
          price: 250,
          durationMinutes: 60,
          active: true,
          risk: "alto",
          riskTone: "alto",
          riskLabel: "Alto",
          icon: "wand",
          soldCount: 3,
        },
      ],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });
  });

  it("deve criar serviço normalizando o ícone quando ele não for informado", async () => {
    mockedServicesRepository.create.mockResolvedValue({
      id: "service-1",
      userId: "user-1",
      name: "Laser Fracionado",
      description: null,
      price: 320,
      durationMinutes: 90,
      riskLevel: ServiceRiskLevel.MEDIUM,
      iconKey: "wand",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const result = await servicesService.create("user-1", {
      name: "Laser Fracionado",
      price: 320,
      durationMinutes: 90,
      risk: "medio",
      active: true,
    });

    expect(mockedServicesRepository.create).toHaveBeenCalledWith({
      userId: "user-1",
      name: "Laser Fracionado",
      price: 320,
      durationMinutes: 90,
      riskLevel: ServiceRiskLevel.MEDIUM,
      iconKey: "wand",
      active: true,
    });
    expect(result).toEqual({
      id: "service-1",
      name: "Laser Fracionado",
      description: null,
      price: 320,
      durationMinutes: 90,
      active: true,
      risk: "medio",
      riskTone: "medio",
      riskLabel: "Médio",
      icon: "wand",
      soldCount: 0,
    });
  });

  it("deve retornar 404 ao buscar serviço inexistente", async () => {
    mockedServicesRepository.findById.mockResolvedValue(null);

    await expect(servicesService.getById("user-1", "service-1")).rejects.toMatchObject({
      statusCode: 404,
      code: "RESOURCE_NOT_FOUND",
    });

    expect(mockedServicesRepository.countSoldByServiceId).not.toHaveBeenCalled();
  });

  it("deve atualizar serviço preservando risco atual quando o payload não informar risco", async () => {
    mockedServicesRepository.findById.mockResolvedValue({
      id: "service-1",
      userId: "user-1",
      name: "Serviço Atual",
      description: "Descrição atual",
      price: 180,
      durationMinutes: 45,
      riskLevel: ServiceRiskLevel.LOW,
      iconKey: "face",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    mockedServicesRepository.update.mockResolvedValue({
      id: "service-1",
      userId: "user-1",
      name: "Serviço Atualizado",
      description: "Descrição atual",
      price: 220,
      durationMinutes: 50,
      riskLevel: ServiceRiskLevel.LOW,
      iconKey: "face",
      active: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    mockedServicesRepository.countSoldByServiceId.mockResolvedValue(2);

    const result = await servicesService.update("user-1", "service-1", {
      name: "Serviço Atualizado",
      price: 220,
      durationMinutes: 50,
      active: false,
    });

    expect(mockedServicesRepository.update).toHaveBeenCalledWith("service-1", {
      name: "Serviço Atualizado",
      price: 220,
      durationMinutes: 50,
      riskLevel: ServiceRiskLevel.LOW,
      iconKey: "face",
      active: false,
    });
    expect(mockedServicesRepository.countSoldByServiceId).toHaveBeenCalledWith("user-1", "service-1");
    expect(result).toEqual({
      id: "service-1",
      name: "Serviço Atualizado",
      description: "Descrição atual",
      price: 220,
      durationMinutes: 50,
      active: false,
      risk: "baixo",
      riskTone: "baixo",
      riskLabel: "Baixo",
      icon: "face",
      soldCount: 2,
    });
  });

  it("deve retornar 404 ao remover serviço inexistente", async () => {
    mockedServicesRepository.findById.mockResolvedValue(null);

    await expect(servicesService.remove("user-1", "service-1")).rejects.toMatchObject({
      statusCode: 404,
      code: "RESOURCE_NOT_FOUND",
    });

    expect(mockedServicesRepository.delete).not.toHaveBeenCalled();
  });
});
