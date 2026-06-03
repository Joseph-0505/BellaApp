export default function statusClass(status) {
  if (status === "confirmado") return "status-confirmado";
  if (status === "pendente") return "status-pendente";
  if (status === "cancelado") return "status-cancelado";
  if (status === "concluido") return "status-concluido";
  return "status-agendado";
}
