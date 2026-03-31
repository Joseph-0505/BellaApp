export const DEFAULT_HOURS = ["09:00", "10:00", "11:00", "14:00", "15:00"];

export const API_STATUS_OPTIONS = [
  { value: "todos", label: "Todos status" },
  { value: "pendente", label: "Pendente" },
  { value: "confirmado", label: "Confirmado" },
  { value: "concluido", label: "Concluido" },
  { value: "cancelado", label: "Cancelado" },
];

export function riskLabel(risk) {
  if (risk === "Todos") return "Todos";
  if (risk === "alto") return "Risco alto";
  if (risk === "medio") return "Risco medio";
  if (risk === "baixo")  return "Risco baixo";
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

export const CLIENT_STATUS_OPTIONS = [
  { value: "todos", label: "Todos status" },
  { value: "ativo", label: "Ativos" },
  { value: "inativo", label: "Inativos" },
];

export function statusLabel(status) {
  if (status === "confirmado") return "Confirmado";
  if (status === "pendente") return "Pendente";
  if (status === "concluido") return "Concluido";
  if (status === "cancelado") return "Cancelado";
  if (status === "todos") return "Todos";
  if (status === "ativo") return "Ativo";
  if (status === "inativo") return "Inativo";
  if (status === "novo") return "Novo";
  if (status === "risco") return "Risco alto";

  return "Agendado";
}


