export function getActionsByStatus(appointment) {
  const status = appointment?.status;
  const paymentStatus = appointment?.paymentStatus;

  if (status === "pendente") return ["Confirmar", "Remarcar", "Cancelar"];
  if (status === "confirmado") return ["Receber", "Remarcar", "Cancelar"];
  if (status === "concluido" && paymentStatus !== "pago") return ["Receber"];
  return [];
}

export function actionClass(action) {
  if (action === "Ativar") return "is-success";
  if (action === "Inativar") return "is-warning";
  if (action === "Confirmar") return "is-success";
  if (action === "Receber") return "is-success";
  if (action === "Reenviar convite") return "is-info";
  if (action === "Remarcar") return "is-warning";
  if (action === "Editar") return "is-warning";
  if (action === "Cancelar") return "is-danger";
  if (action === "Excluir") return "is-danger";
  if (action === "Visualizar") return "is-info";
  return "";
}
