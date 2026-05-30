import { Prisma } from "@prisma/client";

type RoomRecord = Prisma.RoomGetPayload<Record<string, never>>;

export type RoomResponse = {
  id: string;
  name: string;
  color: string | null;
  active: boolean;
  status: "ativo" | "inativo";
  monthlyAppointments: number;
  createdAt: string;
  updatedAt: string;
};

export function toRoomResponse(room: RoomRecord, monthlyAppointments = 0): RoomResponse {
  return {
    id: room.id,
    name: room.name,
    color: room.color ?? null,
    active: room.active,
    status: room.active ? "ativo" : "inativo",
    monthlyAppointments,
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
  };
}
