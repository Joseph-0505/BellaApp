import type { ClientProfile, ClientsListResponse } from "../types/client";
import { apiDelete, apiGet, apiPost, apiPut, unwrapData } from "./api";

const CLIENTS_BASE_PATH = "/api/v1/clients";

interface ListClientsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreateClientPayload {
  name: string;
  phone: string;
  email?: string;
  cpf?: string;
  notes?: string;
}

export async function listClients({
  page = 1,
  limit = 100,
  search,
}: ListClientsParams = {}): Promise<ClientsListResponse> {
  const response = await apiGet(CLIENTS_BASE_PATH, {
    query: {
      page,
      limit,
      search: search?.trim() || undefined,
    },
  });

  return response as ClientsListResponse;
}

export async function createClient(payload: CreateClientPayload): Promise<ClientProfile> {
  const response = await apiPost(CLIENTS_BASE_PATH, payload);
  const client = unwrapData<ClientProfile>(response);

  if (!client) {
    throw new Error("O servidor retornou uma resposta inválida.");
  }

  return client;
}

export async function updateClient(id: string, payload: CreateClientPayload): Promise<ClientProfile> {
  const client = unwrapData<ClientProfile>(await apiPut(`${CLIENTS_BASE_PATH}/${id}`, payload));
  if (!client) throw new Error("Resposta inválida ao editar cliente.");
  return client;
}
export async function deleteClient(id: string) {
  await apiDelete(`${CLIENTS_BASE_PATH}/${id}`);
}
