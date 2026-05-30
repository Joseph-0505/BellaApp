import { Prisma } from "@prisma/client";
import { mapRiskLevelToResponse } from "../utils/service-catalog";

type ServiceRecord = Prisma.ServiceGetPayload<Record<string, never>>;

export type ServiceResponse = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number;
  active: boolean;
  risk: "baixo" | "medio" | "alto";
  riskTone: "baixo" | "medio" | "alto";
  riskLabel: string;
  icon: string;
  soldCount: number;
};

// Adapta o serviço salvo no banco para o contrato usado pela API e pelo frontend.
export function toServiceResponse(service: ServiceRecord, soldCount = 0): ServiceResponse {
  const riskResponse = mapRiskLevelToResponse(service.riskLevel);

  return {
    id: service.id,
    name: service.name,
    description: service.description ?? null,
    price: Number(service.price),
    durationMinutes: service.durationMinutes,
    active: service.active,
    risk: riskResponse.risk,
    riskTone: riskResponse.riskTone,
    riskLabel: riskResponse.riskLabel,
    icon: service.iconKey,
    soldCount,
  };
}
