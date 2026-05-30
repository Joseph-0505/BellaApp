import { AppError } from "../../shared/errors/app-error";
import { toRoomResponse } from "../../shared/mappers/room-response";
import { buildPaginationMeta } from "../../shared/utils/pagination";
import { userClinicContextService } from "../../shared/auth/user-clinic-context";
import {
  CreateRoomResponseDto,
  GetRoomResponseDto,
  ListRoomsResponseDto,
  RoomRequestDto,
  RoomsQueryDto,
  UpdateRoomResponseDto,
} from "./rooms.dtos";
import { roomsRepository } from "./rooms.repository";

async function getMonthlyAppointmentsCount(
  clinicId: string,
  roomId: string,
): Promise<number> {
  const counts = await roomsRepository.countMonthlyAppointmentsByRoomIds(
    clinicId,
    [roomId],
  );
  return counts.get(roomId) ?? 0;
}

class RoomsService {
  async list(
    userId: string,
    query: RoomsQueryDto,
  ): Promise<ListRoomsResponseDto> {
    const context = await userClinicContextService.getOrThrow(userId);

    const [rooms, total] = await Promise.all([
      roomsRepository.listByUser({
        clinicId: context.clinicId,
        page: query.page,
        limit: query.limit,
        ...(query.search ? { search: query.search } : {}),
        ...(query.active !== undefined ? { active: query.active } : {}),
      }),
      roomsRepository.countByUser({
        clinicId: context.clinicId,
        ...(query.search ? { search: query.search } : {}),
        ...(query.active !== undefined ? { active: query.active } : {}),
      }),
    ]);

    const counts = await roomsRepository.countMonthlyAppointmentsByRoomIds(
      context.clinicId,
      rooms.map((room) => room.id),
    );

    return {
      data: rooms.map((room) => toRoomResponse(room, counts.get(room.id) ?? 0)),
      meta: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  async create(
    userId: string,
    input: RoomRequestDto,
  ): Promise<CreateRoomResponseDto> {
    const context = await userClinicContextService.getOrThrow(userId);
    const room = await roomsRepository.create({
      userId,
      clinicId: context.clinicId,
      name: input.name,
      active: input.active,
      ...(input.color ? { color: input.color } : {}),
    });

    return toRoomResponse(room, 0);
  }

  async getById(userId: string, id: string): Promise<GetRoomResponseDto> {
    const context = await userClinicContextService.getOrThrow(userId);
    const room = await roomsRepository.findById(context.clinicId, id);

    if (!room) {
      throw new AppError(404, "RESOURCE_NOT_FOUND", "Sala não encontrada.");
    }

    return toRoomResponse(
      room,
      await getMonthlyAppointmentsCount(context.clinicId, room.id),
    );
  }

  async update(
    userId: string,
    id: string,
    input: RoomRequestDto,
  ): Promise<UpdateRoomResponseDto> {
    const context = await userClinicContextService.getOrThrow(userId);
    const currentRoom = await roomsRepository.findById(context.clinicId, id);

    if (!currentRoom) {
      throw new AppError(404, "RESOURCE_NOT_FOUND", "Sala não encontrada.");
    }

    const room = await roomsRepository.update(id, {
      name: input.name,
      active: input.active,
      ...(input.color ? { color: input.color } : {}),
    });

    return toRoomResponse(
      room,
      await getMonthlyAppointmentsCount(context.clinicId, room.id),
    );
  }

  async remove(userId: string, id: string): Promise<void> {
    const context = await userClinicContextService.getOrThrow(userId);
    const room = await roomsRepository.findById(context.clinicId, id);

    if (!room) {
      throw new AppError(404, "RESOURCE_NOT_FOUND", "Sala não encontrada.");
    }

    await roomsRepository.delete(id);
  }
}

export const roomsService = new RoomsService();
