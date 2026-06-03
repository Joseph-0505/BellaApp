import { DEFAULT_TIME_SLOTS } from "./timeUtils";

export const DEFAULT_HOURS = DEFAULT_TIME_SLOTS;

export const API_STATUS_OPTIONS = [
  { value: "todos", label: "Todos status" },
  { value: "pendente", label: "Pendente" },
  { value: "confirmado", label: "Confirmado" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
];

export function riskLabel(risk) {
  if (risk === "todos" || risk === "Todos") return "Todos";
  if (risk === "alto") return "Risco alto";
  if (risk === "medio") return "Risco médio";
  if (risk === "baixo") return "Risco baixo";

  return "Não informado";
}

export const SERVICE_RISK_OPTIONS = [
  { value: "todos", label: "Todos os riscos" },
  { value: "baixo", label: "Baixo" },
  { value: "medio", label: "Médio" },
  { value: "alto", label: "Alto" },
];

export function riskColor(risk) {
  if (risk === "alto") return "#9d1d3f";
  if (risk === "medio") return "#9b6a00";
  return "#1a7f4d";
}

export function statusColor(status) {
  if (status === "confirmado") return "#dff3e7";
  if (status === "pendente") return "#f8ecd6";
  if (status === "concluido") return "#dfe9f8";
  if (status === "cancelado") return "#e2e8f0";
  return "#f3f3f3";
}

export const CLIENT_STATUS_OPTIONS = [
  { value: "todos", label: "Todos status" },
  { value: "ativo", label: "Ativos" },
  { value: "inativo", label: "Inativos" },
];

export function statusLabel(status) {
  if (status === "confirmado") return "Confirmado";
  if (status === "pendente") return "Pendente";
  if (status === "concluido") return "Concluído";
  if (status === "cancelado") return "Cancelado";
  if (status === "todos") return "Todos";
  if (status === "ativo") return "Ativo";
  if (status === "inativo") return "Inativo";
  if (status === "novo") return "Novo";
  if (status === "risco") return "Risco alto";

  return "Agendado";
}

