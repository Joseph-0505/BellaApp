import { apiDelete, apiGet, apiPost, apiPut } from "./api";

const CLIENTS_BASE_PATH = "/api/v1/clients";
const AVATAR_TONES = ["rose", "sand", "sage", "stone", "mist", "plum", "mint", "steel"];

function pickAvatarTone(name) {
  const score = String(name || "")
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);

  return AVATAR_TONES[score % AVATAR_TONES.length];
}

function toClientViewModel(client) {
  return {
    id: client.id,
    name: client.name,
    email: client.email || "Sem e-mail",
    phone: client.phone,
    cpf: client.cpf || "",
    notes: client.notes || "",
    latestVisit: "Sem historico",
    latestVisitNote: client.notes || "Nenhum atendimento registrado",
    nextAppointment: "Sem agenda",
    professional: "Nao definido",
    totalSpent: 0,
    status: "ativo",
    avatarTone: pickAvatarTone(client.name),
  };
}

function toClientPayload(input) {
  return {
    name: String(input.name || "").trim(),
    phone: String(input.phone || "").trim(),
    ...(String(input.email || "").trim() ? { email: String(input.email).trim() } : {}),
    ...(String(input.cpf || "").trim() ? { cpf: String(input.cpf).trim() } : {}),
    ...(String(input.notes || "").trim() ? { notes: String(input.notes).trim() } : {}),
  };
}

export async function listClients({ limit = 10, page = 1, search = "" } = {}) {
  const response = await apiGet(CLIENTS_BASE_PATH, {
    query: {
      limit,
      page,
      search,
    },
  });

  return {
    items: Array.isArray(response?.data) ? response.data.map(toClientViewModel) : [],
    meta: response?.meta || {
      limit,
      page,
      total: 0,
      totalPages: 0,
    },
  };
}

export async function createClient(input) {
  const response = await apiPost(CLIENTS_BASE_PATH, toClientPayload(input));
  return response?.data ? toClientViewModel(response.data) : null;
}

export async function updateClient(id, input) {
  const response = await apiPut(`${CLIENTS_BASE_PATH}/${id}`, toClientPayload(input));
  return response?.data ? toClientViewModel(response.data) : null;
}

export async function deleteClient(id) {
  await apiDelete(`${CLIENTS_BASE_PATH}/${id}`);
}
