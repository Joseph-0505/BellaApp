export function getActionsByStatus(status) {
  if (status === "pendente") return ["Confirmar", "Remarcar", "Cancelar"];
  if (status === "confirmado") return ["Concluir", "Remarcar", "Cancelar"];
  return [];
}

export function actionClass(action) {
  if (action === "Confirmar") return "is-success";
  if (action === "Concluir") return "is-success";
  if (action === "Remarcar") return "is-warning";
  if (action === "Cancelar") return "is-danger";
  return "";
}
