export default function statusClass(status) {
  if (status === "confirmado") return "status-confirmado";
  if (status === "pendente") return "status-pendente";
  if (status === "cancelado") return "status-cancelado";
  if (status === "em_atendimento") return "status-em_atendimento";
  if (status === "concluido") return "status-concluido";
  if (status === "faltou") return "status-faltou";
  return "status-agendado";
}
