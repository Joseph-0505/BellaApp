import { apiDelete, apiGet, apiPost, apiPut } from "./api";
import { normalizeRoomColor, resolveRoomColor } from "../utils/roomUtils";

const ROOMS_BASE_PATH = "/api/v1/rooms";

function toRoomViewModel(room) {
  const createdAt = room.createdAt || room.created_at || "";
  const updatedAt = room.updatedAt || room.updated_at || "";
  const monthlyAppointmentsRaw =
    room.monthlyAppointments ??
    room.monthly_appointments ??
    room.appointmentsPerMonth ??
    room.appointmentsCount ??
    null;
  const monthlyAppointments =
    monthlyAppointmentsRaw === null || monthlyAppointmentsRaw === undefined
      ? null
      : Number(monthlyAppointmentsRaw);
  const active =
    typeof room.active === "boolean" ? room.active : String(room.status || "").trim().toLowerCase() !== "inativo";
  const colorInput = room.color || room.hexColor || room.backgroundColor || "";
  const normalizedColor = normalizeRoomColor(colorInput);

  return {
    id: room.id,
    name: String(room.name || "").trim(),
    color: resolveRoomColor(colorInput),
    colorDisplay: normalizedColor || "Cor padrao",
    active,
    status: active ? "ativo" : "inativo",
    monthlyAppointments: Number.isFinite(monthlyAppointments) ? monthlyAppointments : null,
    monthlyAppointmentsLabel: Number.isFinite(monthlyAppointments)
      ? `${monthlyAppointments} no mes`
      : "Aguardando backend",
    createdAt,
    created_at: createdAt,
    updatedAt,
    updated_at: updatedAt,
  };
}

function toRoomPayload(input) {
  const status = String(input.status || "").trim().toLowerCase();
  const active =
    typeof input.active === "boolean" ? input.active : status ? status === "ativo" : true;
  const color = normalizeRoomColor(input.color);

  return {
    name: String(input.name || "").trim(),
    active,
    ...(color ? { color } : {}),
  };
}

export async function getRooms({ active, limit = 10, page = 1, search = "" } = {}) {
  const response = await apiGet(ROOMS_BASE_PATH, {
    query: {
      active,
      limit,
      page,
      search,
    },
  });

  return {
    items: Array.isArray(response?.data) ? response.data.map(toRoomViewModel) : [],
    meta: response?.meta || {
      limit,
      page,
      total: 0,
      totalPages: 0,
    },
  };
}

export async function createRoom(input) {
  const response = await apiPost(ROOMS_BASE_PATH, toRoomPayload(input));
  return response?.data ? toRoomViewModel(response.data) : null;
}

export async function updateRoom(id, input) {
  const response = await apiPut(`${ROOMS_BASE_PATH}/${id}`, toRoomPayload(input));
  return response?.data ? toRoomViewModel(response.data) : null;
}

export async function deleteRoom(id) {
  await apiDelete(`${ROOMS_BASE_PATH}/${id}`);
}

export async function toggleRoomStatus(id, input) {
  const nextActive =
    typeof input?.active === "boolean"
      ? !input.active
      : String(input?.status || "").trim().toLowerCase() !== "ativo";

  return updateRoom(id, {
    ...input,
    active: nextActive,
    status: nextActive ? "ativo" : "inativo",
  });
}
