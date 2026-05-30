import { z } from "zod";
import { ServiceResponse } from "../../shared/mappers/service-response";
import { serviceBodySchema, serviceParamsSchema, servicesQuerySchema } from "./services.schemas";

export type ServiceRequestDto = z.infer<typeof serviceBodySchema>;
export type ServiceParamsDto = z.infer<typeof serviceParamsSchema>;
export type ServicesQueryDto = z.infer<typeof servicesQuerySchema>;

export type CreateServiceResponseDto = ServiceResponse;
export type GetServiceResponseDto = ServiceResponse;
export type UpdateServiceResponseDto = ServiceResponse;
export type ListServicesResponseDto = {
  data: ServiceResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
