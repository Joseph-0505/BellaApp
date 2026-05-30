import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

type ListClientsParams = {
  clinicId: string;
  page: number;
  limit: number;
  search?: string;
};

type CountClientsParams = {
  clinicId: string;
  search?: string;
};

function buildClientWhere(
  clinicId: string,
  search?: string,
): Prisma.ClientWhereInput {
  return {
    clinicId,
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : {}),
  };
}

class ClientsRepository {
  listByUser(params: ListClientsParams) {
    const { clinicId, page, limit, search } = params;

    return prisma.client.findMany({
      where: buildClientWhere(clinicId, search),
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  countByUser(params: CountClientsParams) {
    const { clinicId, search } = params;

    return prisma.client.count({
      where: buildClientWhere(clinicId, search),
    });
  }

  findById(clinicId: string, id: string) {
    return prisma.client.findFirst({
      where: {
        id,
        clinicId,
      },
    });
  }

  findByCpf(clinicId: string, cpf: string) {
    return prisma.client.findUnique({
      where: {
        clinicId_cpf: {
          clinicId,
          cpf,
        },
      },
    });
  }

  listAppointmentActivityByClientIds(clinicId: string, clientIds: string[]) {
    return prisma.appointment.findMany({
      where: {
        clinicId,
        clientId: {
          in: clientIds,
        },
      },
      select: {
        clientId: true,
        scheduledAt: true,
        status: true,
        notes: true,
        professional: {
          select: {
            name: true,
          },
        },
        service: {
          select: {
            name: true,
            price: true,
          },
        },
      },
      orderBy: {
        scheduledAt: "desc",
      },
    });
  }

  create(data: {
    userId: string;
    clinicId: string;
    name: string;
    phone: string;
    email?: string;
    cpf?: string;
    notes?: string;
  }) {
    return prisma.client.create({
      data,
    });
  }

  update(
    id: string,
    data: {
      name: string;
      phone: string;
      email?: string;
      cpf?: string;
      notes?: string;
    },
  ) {
    return prisma.client.update({
      where: { id },
      data,
    });
  }

  delete(id: string) {
    return prisma.client.delete({
      where: { id },
    });
  }
}

export const clientsRepository = new ClientsRepository();

export type { CountClientsParams, ListClientsParams };
