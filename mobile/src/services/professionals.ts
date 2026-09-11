import type {
  ProfessionalProfile,
  ProfessionalsListResponse,
  ProfessionalStatus,
} from "../types/professional";
import { apiDelete, apiGet, apiPost, apiPut, unwrapData } from "./api";

const PROFESSIONALS_BASE_PATH = "/api/v1/professionals";

interface ListProfessionalsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProfessionalStatus;
}

export interface CreateProfessionalPayload {
  name: string;
  specialty: string;
  phone: string;
  email?: string;
  status: ProfessionalStatus;
}

export async function listProfessionals({
  page = 1,
  limit = 100,
  search,
  status,
}: ListProfessionalsParams = {}): Promise<ProfessionalsListResponse> {
  const response = await apiGet(PROFESSIONALS_BASE_PATH, {
    query: {
      page,
      limit,
      search: search?.trim() || undefined,
      status,
    },
  });

  return response as ProfessionalsListResponse;
}

export async function createProfessional(
  payload: CreateProfessionalPayload,
): Promise<ProfessionalProfile> {
  const response = await apiPost(PROFESSIONALS_BASE_PATH, payload);
  const professional = unwrapData<ProfessionalProfile>(response);

  if (!professional) {
    throw new Error("O servidor retornou uma resposta inválida.");
  }

  return professional;
}

export async function updateProfessional(id: string, payload: CreateProfessionalPayload): Promise<ProfessionalProfile> {
 const record = unwrapData<ProfessionalProfile>(await apiPut(`/api/v1/professionals/${id}`, payload));
 if (!record) throw new Error("Resposta inválida ao salvar.");
 return record;
}
export async function deleteProfessional(id: string) {
 await apiDelete(`/api/v1/professionals/${id}`);
}
