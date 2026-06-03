import { formatPhone, normalizeCpf, normalizeEmail } from "../utils/formatters";
import { apiDelete, apiGet, apiPost, apiPut } from "./api";

const CLIENTS_BASE_PATH = "/api/v1/clients";
const AVATAR_TONES = ["rose", "sand", "sage", "stone", "mist", "plum", "mint", "steel"];

function pickAvatarTone(name) {
  const score = String(name || "")
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);

  return AVATAR_TONES[score % AVATAR_TONES.length];
}

function buildInitials(name) {
  const initials = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "CL";
}

function formatClientDate(isoDate) {
  if (!isoDate) {
    return null;
  }

  return new Date(isoDate).toLocaleDateString("pt-BR");
}

function toClientViewModel(client) {
  const latestVisit = formatClientDate(client.latestVisitAt);
  const nextAppointment = formatClientDate(client.nextAppointmentAt);
  const hasLatestVisit = Boolean(latestVisit || client.latestVisit);
  const hasNextAppointment = Boolean(nextAppointment || client.nextAppointment);
  const totalSpent = Number(client.totalSpent || 0);
  const status = client.status || "novo";

  return {
    id: client.id,
    name: client.name,
    initials: buildInitials(client.name),
    email: client.email || "",
    emailDisplay: client.email || "Sem e-mail cadastrado",
    phone: client.phone || "",
    phoneDisplay: formatPhone(client.phone) || client.phone || "Sem telefone",
    cpf: client.cpf || "",
    notes: client.notes || "",
    hasLatestVisit,
    latestVisit: latestVisit || client.latestVisit || "Sem atendimentos",
    latestVisitNote: client.latestVisitNote || "Atendimento concluído",
    latestVisitEmptyLabel: "Registrar primeiro atendimento",
    hasNextAppointment,
    nextAppointment: nextAppointment || client.nextAppointment || "Sem agendamento",
    nextAppointmentEmptyLabel: "Agendar agora",
    professional: client.professional || "",
    professionalDisplay: client.professional || "Profissional a confirmar",
    totalSpent,
    status,
    avatarTone: pickAvatarTone(client.name),
  };
}

function toClientPayload(input) {
  const email = normalizeEmail(input.email);
  const cpf = normalizeCpf(input.cpf);

  return {
    name: String(input.name || "").trim(),
    phone: formatPhone(input.phone).trim(),
    ...(email ? { email } : {}),
    ...(cpf ? { cpf } : {}),
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
