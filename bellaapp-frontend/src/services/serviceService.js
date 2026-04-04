import { apiDelete, apiGet, apiPost, apiPut } from "./api";

const SERVICES_BASE_PATH = "/api/v1/services";
const RISK_LABELS = {
  baixo: "Baixo",
  medio: "Medio",
  alto: "Alto",
};

function inferServiceIcon(name) {
  const normalizedName = String(name || "").toLowerCase();

  if (normalizedName.includes("laser")) return "wand";
  if (normalizedName.includes("botox") || normalizedName.includes("preench")) return "syringe";
  if (normalizedName.includes("massagem")) return "lotus";
  if (normalizedName.includes("peeling")) return "flask";
  if (normalizedName.includes("drenagem")) return "drop";
  return "face";
}

function toServiceViewModel(service) {
  const risk = service.risk || "baixo";
  const icon = service.icon || inferServiceIcon(service.name);

  return {
    id: service.id,
    name: service.name,
    description: service.description || "",
    price: Number(service.price || 0),
    durationMinutes: Number(service.durationMinutes || 0),
    active: Boolean(service.active),
    status: service.active ? "ativo" : "inativo",
    risk,
    riskTone: service.riskTone || risk,
    riskLabel: service.riskLabel || RISK_LABELS[risk] || "Nao informado",
    icon,
    soldCount: Number(service.soldCount || 0),
  };
}

function toServicePayload(input) {
  const status = String(input.status || "").trim().toLowerCase();
  const active =
    typeof input.active === "boolean" ? input.active : status ? status === "ativo" : true;

  return {
    name: String(input.name || "").trim(),
    price: Number(input.price || 0),
    durationMinutes: Number(input.durationMinutes || 0),
    active,
    ...(String(input.risk || "").trim() ? { risk: String(input.risk).trim().toLowerCase() } : {}),
    ...(String(input.icon || "").trim() ? { icon: String(input.icon).trim() } : {}),
    ...(String(input.description || input.notes || "").trim()
      ? { description: String(input.description || input.notes || "").trim() }
      : {}),
  };
}

export async function listServices({ active, risk, limit = 10, page = 1, search = "" } = {}) {
  const response = await apiGet(SERVICES_BASE_PATH, {
    query: {
      active,
      risk,
      limit,
      page,
      search,
    },
  });

  return {
    items: Array.isArray(response?.data) ? response.data.map(toServiceViewModel) : [],
    meta: response?.meta || {
      limit,
      page,
      total: 0,
      totalPages: 0,
    },
  };
}

export async function createService(input) {
  const response = await apiPost(SERVICES_BASE_PATH, toServicePayload(input));
  return response?.data ? toServiceViewModel(response.data) : null;
}

export async function updateService(id, input) {
  const response = await apiPut(`${SERVICES_BASE_PATH}/${id}`, toServicePayload(input));
  return response?.data ? toServiceViewModel(response.data) : null;
}

export async function deleteService(id) {
  await apiDelete(`${SERVICES_BASE_PATH}/${id}`);
}
