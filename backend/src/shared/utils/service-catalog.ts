import { ServiceRiskLevel } from "@prisma/client";

export const serviceRiskValues = ["baixo", "medio", "alto"] as const;
export const serviceIconValues = [
  "face",
  "syringe",
  "wand",
  "drop",
  "lotus",
  "flask",
  "spark",
  "pulse",
  "leaf",
] as const;

export type ServiceRiskValue = (typeof serviceRiskValues)[number];
export type ServiceIconValue = (typeof serviceIconValues)[number];

// Traduz o risco salvo no banco para o formato esperado pela API e pela interface.
const riskLevelToResponseMap: Record<
  ServiceRiskLevel,
  { risk: ServiceRiskValue; riskTone: ServiceRiskValue; riskLabel: string }
> = {
  LOW: {
    risk: "baixo",
    riskTone: "baixo",
    riskLabel: "Baixo",
  },
  MEDIUM: {
    risk: "medio",
    riskTone: "medio",
    riskLabel: "Médio",
  },
  HIGH: {
    risk: "alto",
    riskTone: "alto",
    riskLabel: "Alto",
  },
};

// Tenta escolher um ícone coerente com base no nome do serviço quando nenhum ícone foi informado.
export function inferServiceIcon(name: string): ServiceIconValue {
  const normalizedName = String(name || "").toLowerCase();

  if (normalizedName.includes("laser")) return "wand";
  if (normalizedName.includes("botox") || normalizedName.includes("preench")) return "syringe";
  if (normalizedName.includes("massagem")) return "lotus";
  if (normalizedName.includes("peeling")) return "flask";
  if (normalizedName.includes("drenagem")) return "drop";

  return "face";
}

// Garante que a API sempre salve um ícone válido.
export function normalizeServiceIcon(icon: string | undefined, serviceName: string): ServiceIconValue {
  if (icon && serviceIconValues.includes(icon as ServiceIconValue)) {
    return icon as ServiceIconValue;
  }

  return inferServiceIcon(serviceName);
}

// Converte o nível de risco em português para o enum persistido no banco.
export function mapRiskToLevel(risk: ServiceRiskValue | undefined): ServiceRiskLevel | undefined {
  if (!risk) {
    return undefined;
  }

  if (risk === "alto") {
    return ServiceRiskLevel.HIGH;
  }

  if (risk === "medio") {
    return ServiceRiskLevel.MEDIUM;
  }

  return ServiceRiskLevel.LOW;
}

// Converte o enum do banco para o contrato de resposta da API.
export function mapRiskLevelToResponse(riskLevel: ServiceRiskLevel) {
  return riskLevelToResponseMap[riskLevel];
}
