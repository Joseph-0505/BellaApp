import { z } from "zod";
import { RoomResponse } from "../../shared/mappers/room-response";
import { roomBodySchema, roomParamsSchema, roomsQuerySchema } from "./rooms.schemas";

export type RoomRequestDto = z.infer<typeof roomBodySchema>;
export type RoomParamsDto = z.infer<typeof roomParamsSchema>;
export type RoomsQueryDto = z.infer<typeof roomsQuerySchema>;

export type CreateRoomResponseDto = RoomResponse;
export type GetRoomResponseDto = RoomResponse;
export type UpdateRoomResponseDto = RoomResponse;
export type ListRoomsResponseDto = {
  data: RoomResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
