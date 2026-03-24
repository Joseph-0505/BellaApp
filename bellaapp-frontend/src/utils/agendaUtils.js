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
