export function getActionsByStatus(status){
  if(status === "pendente") return ["Confirmar", "Remarcar", "Cancelar"];
  if(status === "confirmado") return ["Iniciar atendimento", "Remarcar", "Cancelar"];
  if(status === "em_atendimento") return ["Concluir", "Cancelar"];
  return[]; 
}

export function actionClass(action) {
  if (action === "Confirmar") return "is-success";
  if (action === "Iniciar atendimento") return "is-info";
  if (action === "Concluir") return "is-success";
  if (action === "Remarcar") return "is-warning";
  if (action === "Cancelar") return "is-danger";
  return "";
}


