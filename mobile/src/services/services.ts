import type {
  ServiceProfile,
  ServiceRisk,
  ServicesListResponse,
} from "../types/service";
import { apiDelete, apiGet, apiPost, apiPut, unwrapData } from "./api";

const SERVICES_BASE_PATH = "/api/v1/services";

interface ListServicesParams {
  active?: boolean;
  page?: number;
  limit?: number;
  risk?: ServiceRisk;
  search?: string;
}

export interface CreateServicePayload {
  name: string;
  price: number;
  durationMinutes: number;
  active: boolean;
  description?: string;
  icon?: string;
  risk?: ServiceRisk;
}

export async function listServices({
  active,
  page = 1,
  limit = 100,
  risk,
  search,
}: ListServicesParams = {}): Promise<ServicesListResponse> {
  const response = await apiGet(SERVICES_BASE_PATH, {
    query: {
      active,
      page,
      limit,
      risk,
      search: search?.trim() || undefined,
    },
  });

  return response as ServicesListResponse;
}

export async function createService(payload: CreateServicePayload): Promise<ServiceProfile> {
  const response = await apiPost(SERVICES_BASE_PATH, payload);
  const service = unwrapData<ServiceProfile>(response);

  if (!service) {
    throw new Error("O servidor retornou uma resposta inválida.");
  }

  return service;
}

export async function updateService(id: string, payload: CreateServicePayload): Promise<ServiceProfile> {
 const record = unwrapData<ServiceProfile>(await apiPut(`/api/v1/services/${id}`, payload));
 if (!record) throw new Error("Resposta inválida ao salvar.");
 return record;
}
export async function deleteService(id: string) {
 await apiDelete(`/api/v1/services/${id}`);
}
