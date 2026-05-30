import { z } from "zod";
import { ClientResponse } from "../../shared/mappers/client-response";
import { clientBodySchema, clientParamsSchema, clientsQuerySchema } from "./clients.schemas";

export type ClientRequestDto = z.infer<typeof clientBodySchema>;
export type ClientParamsDto = z.infer<typeof clientParamsSchema>;
export type ClientsQueryDto = z.infer<typeof clientsQuerySchema>;

export type CreateClientResponseDto = ClientResponse;
export type GetClientResponseDto = ClientResponse;
export type UpdateClientResponseDto = ClientResponse;
export type ListClientsResponseDto = {
  data: ClientResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
