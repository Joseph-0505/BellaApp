export default function statusLabel(status) {
  if (status === "confirmado") return "Confirmado";
  if (status === "pendente") return "Pendente";
  if (status === "cancelado") return "Cancelado";
  if (status === "em_atendimento") return "Em atendimento";
  if (status === "concluido") return "Concluido";
  if (status === "faltou") return "Faltou";
  return "Agendado";
};
