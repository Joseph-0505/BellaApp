import { AppointmentStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

type ListRoomsParams = {
  clinicId: string;
  page: number;
  limit: number;
  search?: string;
  active?: boolean;
};

type CountRoomsParams = {
  clinicId: string;
  search?: string;
  active?: boolean;
};

function getMonthRange(referenceDate = new Date()) {
  const start = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      1,
      0,
      0,
      0,
      0,
    ),
  );
  const end = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth() + 1,
      1,
      0,
      0,
      0,
      0,
    ),
  );

  return { start, end };
}

function buildRoomWhere(
  clinicId: string,
  search?: string,
  active?: boolean,
): Prisma.RoomWhereInput {
  return {
    clinicId,
    ...(typeof active === "boolean" ? { active } : {}),
    ...(search
      ? {
          OR: [{ name: { contains: search } }],
        }
      : {}),
  };
}

class RoomsRepository {
  listByUser(params: ListRoomsParams) {
    const { clinicId, page, limit, search, active } = params;

    return prisma.room.findMany({
      where: buildRoomWhere(clinicId, search, active),
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  countByUser(params: CountRoomsParams) {
    const { clinicId, search, active } = params;

    return prisma.room.count({
      where: buildRoomWhere(clinicId, search, active),
    });
  }

  countAllByClinic(clinicId: string) {
    return prisma.room.count({
      where: { clinicId },
    });
  }

  findById(clinicId: string, id: string) {
    return prisma.room.findFirst({
      where: {
        id,
        clinicId,
      },
    });
  }

  findByNames(clinicId: string, names: string[]) {
    return prisma.room.findMany({
      where: {
        clinicId,
        name: {
          in: names,
        },
      },
    });
  }

  create(data: {
    userId: string;
    clinicId: string;
    name: string;
    color?: string;
    active: boolean;
  }) {
    return prisma.room.create({
      data,
    });
  }

  createMany(
    data: Array<{
      userId: string;
      clinicId: string;
      name: string;
      color?: string;
      active: boolean;
    }>,
  ) {
    if (data.length === 0) {
      return Promise.resolve({ count: 0 });
    }

    return prisma.room.createMany({
      data,
      skipDuplicates: true,
    });
  }

  update(id: string, data: { name: string; color?: string; active: boolean }) {
    return prisma.room.update({
      where: { id },
      data,
    });
  }

  delete(id: string) {
    return prisma.room.delete({
      where: { id },
    });
  }

  async countMonthlyAppointmentsByRoomIds(clinicId: string, roomIds: string[]) {
    if (roomIds.length === 0) {
      return new Map<string, number>();
    }

    const { start, end } = getMonthRange();

    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId,
        roomId: { in: roomIds },
        status: { not: AppointmentStatus.CANCELED },
        scheduledAt: {
          gte: start,
          lt: end,
        },
      },
      select: {
        roomId: true,
      },
    });

    return appointments.reduce((counts, appointment) => {
      if (!appointment.roomId) {
        return counts;
      }

      counts.set(appointment.roomId, (counts.get(appointment.roomId) ?? 0) + 1);
      return counts;
    }, new Map<string, number>());
  }
}

export const roomsRepository = new RoomsRepository();

export type { CountRoomsParams, ListRoomsParams };
