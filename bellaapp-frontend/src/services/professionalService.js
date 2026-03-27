import { apiDelete, apiGet, apiPost, apiPut } from "./api";

const PROFESSIONALS_BASE_PATH = "/api/v1/professionals";

function toProfessionalViewModel(professional) {
  return {
    id: professional.id,
    name: professional.name,
    specialty: professional.specialty || "",
    email: professional.email || "Sem e-mail",
    phone: professional.phone || "",
    status: professional.status || "ativo",
    initials: professional.initials || "",
    tone: professional.tone || "rose",
  };
}

function toProfessionalPayload(input) {
  return {
    name: String(input.name || "").trim(),
    specialty: String(input.specialty || "").trim(),
    phone: String(input.phone || "").trim(),
    status: String(input.status || "ativo").trim().toLowerCase(),
    ...(String(input.email || "").trim() ? { email: String(input.email).trim().toLowerCase() } : {}),
  };
}

export async function listProfessionals({ limit = 10, page = 1, search = "", status } = {}) {
  const response = await apiGet(PROFESSIONALS_BASE_PATH, {
    query: {
      limit,
      page,
      search,
      status,
    },
  });

  return {
    items: Array.isArray(response?.data) ? response.data.map(toProfessionalViewModel) : [],
    meta: response?.meta || {
      limit,
      page,
      total: 0,
      totalPages: 0,
    },
  };
}

export async function createProfessional(input) {
  const response = await apiPost(PROFESSIONALS_BASE_PATH, toProfessionalPayload(input));
  return response?.data ? toProfessionalViewModel(response.data) : null;
}

export async function updateProfessional(id, input) {
  const response = await apiPut(`${PROFESSIONALS_BASE_PATH}/${id}`, toProfessionalPayload(input));
  return response?.data ? toProfessionalViewModel(response.data) : null;
}

export async function deleteProfessional(id) {
  await apiDelete(`${PROFESSIONALS_BASE_PATH}/${id}`);
}
