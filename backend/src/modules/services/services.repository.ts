import { AppointmentStatus, Prisma, ServiceRiskLevel } from "@prisma/client";
import { prisma } from "../../lib/prisma";

type ServiceFilters = {
  search?: string;
  active?: boolean;
  riskLevel?: ServiceRiskLevel;
  minDurationMinutes?: number;
  maxDurationMinutes?: number;
  minPrice?: number;
  maxPrice?: number;
};

type ListServicesParams = {
  clinicId: string;
  page: number;
  limit: number;
  filters: ServiceFilters;
};

type CountServicesParams = {
  clinicId: string;
  filters: ServiceFilters;
};

function buildRangeFilter(
  min?: number,
  max?: number,
): { gte?: number; lte?: number } | undefined {
  if (typeof min !== "number" && typeof max !== "number") {
    return undefined;
  }

  return {
    ...(typeof min === "number" ? { gte: min } : {}),
    ...(typeof max === "number" ? { lte: max } : {}),
  };
}

function buildServiceWhere(
  params: CountServicesParams,
): Prisma.ServiceWhereInput {
  const { clinicId, filters } = params;
  const durationMinutes = buildRangeFilter(
    filters.minDurationMinutes,
    filters.maxDurationMinutes,
  );
  const price = buildRangeFilter(filters.minPrice, filters.maxPrice);

  return {
    clinicId,
    ...(typeof filters.active === "boolean" ? { active: filters.active } : {}),
    ...(durationMinutes ? { durationMinutes } : {}),
    ...(price ? { price } : {}),
    ...(filters.riskLevel ? { riskLevel: filters.riskLevel } : {}),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search } },
            { description: { contains: filters.search } },
          ],
        }
      : {}),
  };
}

class ServicesRepository {
  listByUser(params: ListServicesParams) {
    const { clinicId, page, limit, filters } = params;

    return prisma.service.findMany({
      where: buildServiceWhere({ clinicId, filters }),
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  countByUser(params: CountServicesParams) {
    const { clinicId, filters } = params;

    return prisma.service.count({
      where: buildServiceWhere({ clinicId, filters }),
    });
  }

  findById(clinicId: string, id: string) {
    return prisma.service.findFirst({
      where: {
        id,
        clinicId,
      },
    });
  }

  create(data: {
    userId: string;
    clinicId: string;
    name: string;
    description?: string;
    price: number;
    durationMinutes: number;
    riskLevel?: ServiceRiskLevel;
    iconKey: string;
    active: boolean;
  }) {
    return prisma.service.create({
      data,
    });
  }

  update(
    id: string,
    data: {
      name: string;
      description?: string;
      price: number;
      durationMinutes: number;
      riskLevel?: ServiceRiskLevel;
      iconKey: string;
      active: boolean;
    },
  ) {
    return prisma.service.update({
      where: { id },
      data,
    });
  }

  delete(id: string) {
    return prisma.service.delete({
      where: { id },
    });
  }

  countSoldByServiceIds(clinicId: string, serviceIds: string[]) {
    if (serviceIds.length === 0) {
      return Promise.resolve([]);
    }

    return prisma.appointment.groupBy({
      by: ["serviceId"],
      where: {
        clinicId,
        serviceId: {
          in: serviceIds,
        },
        status: {
          not: AppointmentStatus.CANCELED,
        },
      },
      _count: {
        _all: true,
      },
    });
  }

  countSoldByServiceId(clinicId: string, serviceId: string) {
    return prisma.appointment.count({
      where: {
        clinicId,
        serviceId,
        status: {
          not: AppointmentStatus.CANCELED,
        },
      },
    });
  }
}

export const servicesRepository = new ServicesRepository();

export type { CountServicesParams, ListServicesParams, ServiceFilters };
