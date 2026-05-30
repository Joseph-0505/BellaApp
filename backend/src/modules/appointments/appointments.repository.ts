import { AppointmentStatus, Prisma, ReceivedBy } from "@prisma/client";
import { prisma } from "../../lib/prisma";

type PrismaExecutor = Prisma.TransactionClient | typeof prisma;

type AppointmentFilters = {
  status?: AppointmentStatus;
  date?: string;
  clientId?: string;
  serviceId?: string;
  professionalId?: string;
  roomId?: string;
};

type AppointmentListQuery = AppointmentFilters & {
  page: number;
  limit: number;
};

type FindAppointmentsForDayParams = {
  clinicId: string;
  scheduledAt: Date;
  excludeId?: string;
  professionalId?: string;
  roomId?: string;
};

type AppointmentRecord = Prisma.AppointmentGetPayload<Record<string, never>> & {
  roomId: string | null;
};

type AppointmentRecordWithBilling = Prisma.AppointmentGetPayload<{
  include: {
    billing: true;
  };
}>;

type AppointmentDetailedRecord = Prisma.AppointmentGetPayload<{
  include: {
    billing: true;
    client: {
      select: {
        name: true;
      };
    };
    service: {
      select: {
        name: true;
        price: true;
        durationMinutes: true;
      };
    };
    professional: {
      select: {
        name: true;
      };
    };
  };
}>;

const CONFLICT_BLOCKING_STATUSES = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED,
] as const;

function buildConflictScopeWhere(params: {
  professionalId?: string | undefined;
  roomId?: string | undefined;
}) {
  if (params.roomId) {
    return { roomId: params.roomId };
  }

  if (params.professionalId) {
    return { professionalId: params.professionalId };
  }

  return {};
}

function buildAppointmentsWhere(
  clinicId: string,
  query: AppointmentFilters,
): Prisma.AppointmentWhereInput {
  return {
    clinicId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.clientId ? { clientId: query.clientId } : {}),
    ...(query.serviceId ? { serviceId: query.serviceId } : {}),
    ...(query.professionalId ? { professionalId: query.professionalId } : {}),
    ...(query.roomId ? { roomId: query.roomId } : {}),
    ...(query.date
      ? {
          scheduledAt: {
            gte: new Date(`${query.date}T00:00:00.000Z`),
            lt: new Date(`${query.date}T23:59:59.999Z`),
          },
        }
      : {}),
  };
}

class AppointmentsRepository {
  listByUser(
    clinicId: string,
    query: AppointmentListQuery,
    db: PrismaExecutor = prisma,
  ) {
    return db.appointment.findMany({
      where: buildAppointmentsWhere(clinicId, query),
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: {
        billing: true,
      },
      orderBy: {
        scheduledAt: "asc",
      },
    });
  }

  countByUser(
    clinicId: string,
    query: AppointmentFilters,
    db: PrismaExecutor = prisma,
  ) {
    return db.appointment.count({
      where: buildAppointmentsWhere(clinicId, query),
    });
  }

  findById(
    clinicId: string,
    id: string,
    db: PrismaExecutor = prisma,
  ): Promise<AppointmentRecordWithBilling | null> {
    return db.appointment.findFirst({
      where: {
        id,
        clinicId,
      },
      include: {
        billing: true,
      },
    }) as Promise<AppointmentRecordWithBilling | null>;
  }

  findDetailedById(
    clinicId: string,
    id: string,
    db: PrismaExecutor = prisma,
  ): Promise<AppointmentDetailedRecord | null> {
    return db.appointment.findFirst({
      where: {
        id,
        clinicId,
      },
      include: {
        billing: true,
        client: {
          select: {
            name: true,
          },
        },
        service: {
          select: {
            name: true,
            price: true,
            durationMinutes: true,
          },
        },
        professional: {
          select: {
            name: true,
          },
        },
      },
    }) as Promise<AppointmentDetailedRecord | null>;
  }

  findClientById(clinicId: string, clientId: string) {
    return prisma.client.findFirst({
      where: {
        id: clientId,
        clinicId,
      },
    });
  }

  findServiceById(clinicId: string, serviceId: string) {
    return prisma.service.findFirst({
      where: {
        id: serviceId,
        clinicId,
      },
    });
  }

  findProfessionalById(clinicId: string, professionalId: string) {
    return prisma.professional.findFirst({
      where: {
        id: professionalId,
        clinicId,
      },
    });
  }

  findRoomById(clinicId: string, roomId: string) {
    return prisma.room.findFirst({
      where: {
        id: roomId,
        clinicId,
      },
    });
  }

  findAppointmentsForDay(params: FindAppointmentsForDayParams) {
    const { clinicId, scheduledAt, excludeId, professionalId, roomId } = params;
    const dayStart = new Date(
      Date.UTC(
        scheduledAt.getUTCFullYear(),
        scheduledAt.getUTCMonth(),
        scheduledAt.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
    const dayEnd = new Date(
      Date.UTC(
        scheduledAt.getUTCFullYear(),
        scheduledAt.getUTCMonth(),
        scheduledAt.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    return prisma.appointment.findMany({
      where: {
        clinicId,
        status: {
          in: [...CONFLICT_BLOCKING_STATUSES],
        },
        scheduledAt: {
          gte: dayStart,
          lte: dayEnd,
        },
        ...buildConflictScopeWhere({ professionalId, roomId }),
        ...(excludeId
          ? {
              id: {
                not: excludeId,
              },
            }
          : {}),
      },
      include: {
        service: {
          select: {
            durationMinutes: true,
          },
        },
      },
      orderBy: {
        scheduledAt: "asc",
      },
    });
  }

  create(
    data: {
      userId: string;
      clinicId: string;
      clientId: string;
      serviceId: string;
      professionalId?: string;
      roomId?: string;
      scheduledAt: Date;
      status: AppointmentStatus;
      receivedBy?: ReceivedBy;
      notes?: string;
    },
    db: PrismaExecutor = prisma,
  ) {
    return db.appointment.create({
      data,
      include: {
        billing: true,
      },
    });
  }

  update(
    id: string,
    data: {
      clientId: string;
      serviceId: string;
      professionalId?: string;
      roomId?: string;
      scheduledAt: Date;
      status: AppointmentStatus;
      receivedBy?: ReceivedBy;
      notes?: string;
    },
    db: PrismaExecutor = prisma,
  ) {
    return db.appointment.update({
      where: { id },
      data,
      include: {
        billing: true,
      },
    });
  }

  markAsCompleted(
    id: string,
    receivedBy: ReceivedBy,
    db: PrismaExecutor = prisma,
  ) {
    return db.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.COMPLETED,
        receivedBy,
      },
      include: {
        billing: true,
      },
    });
  }

  delete(id: string, db: PrismaExecutor = prisma) {
    return db.appointment.delete({
      where: { id },
    });
  }
}

export const appointmentsRepository = new AppointmentsRepository();

export { buildConflictScopeWhere, CONFLICT_BLOCKING_STATUSES };

export type {
  AppointmentFilters,
  AppointmentListQuery,
  AppointmentRecordWithBilling as AppointmentRecord,
  AppointmentDetailedRecord,
  FindAppointmentsForDayParams,
  PrismaExecutor,
};
