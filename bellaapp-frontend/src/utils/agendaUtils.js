export const DEFAULT_HOURS = ["09:00", "10:00", "11:00", "14:00", "15:00"];

export const API_STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente" },
  { value: "confirmado", label: "Confirmado" },
  { value: "cancelado", label: "Cancelado" },
];

export const LEGACY_STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente" },
  { value: "confirmado", label: "Confirmado" },
  { value: "concluido", label: "Concluido" },
  { value: "cancelado", label: "Cancelado" },
];

export const RISK_OPTIONS = [
  { value: "baixo", label: "Baixo" },
  { value: "medio", label: "Medio" },
  { value: "alto", label: "Alto" },
];

export function riskLabel(risk) {
  if (risk === "alto") return "Risco alto";
  if (risk === "medio") return "Risco medio";
  return "Risco baixo";
}

export function riskColor(risk) {
  if (risk === "alto") return "#9d1d3f";
  if (risk === "medio") return "#9b6a00";
  return "#1a7f4d";
}

export function statusColor(status) {
  if (status === "confirmado") return "#dff3e7";
  if (status === "pendente") return "#f8ecd6";
  if (status === "concluido") return "#dfe9f8";
  return "#f3f3f3";
}

export function statusLabel(status) {
  if (status === "confirmado") return "Confirmado";
  if (status === "pendente") return "Pendente";
  if (status === "concluido") return "Concluido";
  if (status === "cancelado") return "Cancelado";
  return "Agendado";
}
