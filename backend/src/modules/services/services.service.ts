import { AppError } from "../../shared/errors/app-error";
import { toServiceResponse } from "../../shared/mappers/service-response";
import { buildPaginationMeta } from "../../shared/utils/pagination";
import {
  mapRiskToLevel,
  normalizeServiceIcon,
} from "../../shared/utils/service-catalog";
import { userClinicContextService } from "../../shared/auth/user-clinic-context";
import {
  CreateServiceResponseDto,
  GetServiceResponseDto,
  ListServicesResponseDto,
  ServiceRequestDto,
  ServicesQueryDto,
  UpdateServiceResponseDto,
} from "./services.dtos";
import { servicesRepository, ServiceFilters } from "./services.repository";

type ServiceRecord = NonNullable<
  Awaited<ReturnType<typeof servicesRepository.findById>>
>;
type ServiceCreateData = Parameters<typeof servicesRepository.create>[0];
type ServiceUpdateData = Parameters<typeof servicesRepository.update>[1];

class ServicesService {
  private buildFilters(query: ServicesQueryDto): ServiceFilters {
    const riskLevel = mapRiskToLevel(query.risk);

    return {
      ...(query.search ? { search: query.search } : {}),
      ...(query.active !== undefined ? { active: query.active } : {}),
      ...(riskLevel ? { riskLevel } : {}),
      ...(query.minDurationMinutes !== undefined
        ? { minDurationMinutes: query.minDurationMinutes }
        : {}),
      ...(query.maxDurationMinutes !== undefined
        ? { maxDurationMinutes: query.maxDurationMinutes }
        : {}),
      ...(query.minPrice !== undefined ? { minPrice: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { maxPrice: query.maxPrice } : {}),
    };
  }

  private async getServiceOrThrow(
    clinicId: string,
    id: string,
  ): Promise<ServiceRecord> {
    const service = await servicesRepository.findById(clinicId, id);

    if (!service) {
      throw new AppError(404, "RESOURCE_NOT_FOUND", "Serviço não encontrado.");
    }

    return service;
  }

  private async getSoldCountMap(
    clinicId: string,
    serviceIds: string[],
  ): Promise<Map<string, number>> {
    const soldCounts = await servicesRepository.countSoldByServiceIds(
      clinicId,
      serviceIds,
    );
    return new Map(
      soldCounts.map((item) => [item.serviceId, item._count._all]),
    );
  }

  private buildCreateData(
    userId: string,
    clinicId: string,
    input: ServiceRequestDto,
  ): ServiceCreateData {
    const riskLevel = mapRiskToLevel(input.risk);

    return {
      userId,
      clinicId,
      name: input.name,
      price: input.price,
      durationMinutes: input.durationMinutes,
      iconKey: normalizeServiceIcon(input.icon, input.name),
      active: input.active,
      ...(riskLevel ? { riskLevel } : {}),
      ...(input.description ? { description: input.description } : {}),
    };
  }

  private buildUpdateData(
    currentService: ServiceRecord,
    input: ServiceRequestDto,
  ): ServiceUpdateData {
    return {
      name: input.name,
      price: input.price,
      durationMinutes: input.durationMinutes,
      riskLevel: mapRiskToLevel(input.risk) ?? currentService.riskLevel,
      iconKey: normalizeServiceIcon(
        input.icon ?? currentService.iconKey,
        input.name,
      ),
      active: input.active,
      ...(input.description ? { description: input.description } : {}),
    };
  }

  async list(
    userId: string,
    query: ServicesQueryDto,
  ): Promise<ListServicesResponseDto> {
    const context = await userClinicContextService.getOrThrow(userId);
    const filters = this.buildFilters(query);
    const [services, total] = await Promise.all([
      servicesRepository.listByUser({
        clinicId: context.clinicId,
        page: query.page,
        limit: query.limit,
        filters,
      }),
      servicesRepository.countByUser({ clinicId: context.clinicId, filters }),
    ]);
    const soldCountMap = await this.getSoldCountMap(
      context.clinicId,
      services.map((service) => service.id),
    );

    return {
      data: services.map((service) =>
        toServiceResponse(service, soldCountMap.get(service.id) ?? 0),
      ),
      meta: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  async create(
    userId: string,
    input: ServiceRequestDto,
  ): Promise<CreateServiceResponseDto> {
    const context = await userClinicContextService.getOrThrow(userId);
    const service = await servicesRepository.create(
      this.buildCreateData(userId, context.clinicId, input),
    );

    return toServiceResponse(service, 0);
  }

  async getById(userId: string, id: string): Promise<GetServiceResponseDto> {
    const context = await userClinicContextService.getOrThrow(userId);
    const service = await this.getServiceOrThrow(context.clinicId, id);
    const soldCount = await servicesRepository.countSoldByServiceId(
      context.clinicId,
      id,
    );

    return toServiceResponse(service, soldCount);
  }

  async update(
    userId: string,
    id: string,
    input: ServiceRequestDto,
  ): Promise<UpdateServiceResponseDto> {
    const context = await userClinicContextService.getOrThrow(userId);
    const currentService = await this.getServiceOrThrow(context.clinicId, id);
    const updatedService = await servicesRepository.update(
      id,
      this.buildUpdateData(currentService, input),
    );

    const soldCount = await servicesRepository.countSoldByServiceId(
      context.clinicId,
      id,
    );

    return toServiceResponse(updatedService, soldCount);
  }

  async remove(userId: string, id: string): Promise<void> {
    const context = await userClinicContextService.getOrThrow(userId);
    await this.getServiceOrThrow(context.clinicId, id);
    await servicesRepository.delete(id);
  }
}

export const servicesService = new ServicesService();
