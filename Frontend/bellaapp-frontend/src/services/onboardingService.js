import { getAppointmentsMeta } from "./appointmentService";
import { apiGet, apiPost } from "./api";
import { listClients } from "./clientService";
import { listServices } from "./serviceService";

const ONBOARDING_BASE_PATH = "/api/v1/onboarding";
const CHECKLIST_LIMIT = 1;

function toChecklistItem(id, completed) {
  if (id === "service") {
    return {
      id,
      title: "Criar primeiro servico",
      description: "Cadastre o servico base da sua clinica para comecar a montar a agenda.",
      actionLabel: "Criar servico",
      completed,
    };
  }

  if (id === "client") {
    return {
      id,
      title: "Cadastrar primeiro cliente",
      description: "Adicione o primeiro cadastro para iniciar os atendimentos com contexto real.",
      actionLabel: "Cadastrar cliente",
      completed,
    };
  }

  return {
    id,
    title: "Criar primeiro agendamento",
    description: "Monte o primeiro atendimento e comece a operar direto do painel.",
    actionLabel: "Criar agendamento",
    completed,
  };
}

export function buildOnboardingPayload(input) {
  return {
    businessName: String(input.businessName || "").trim(),
  };
}

export async function getOnboardingStatus() {
  const response = await apiGet(`${ONBOARDING_BASE_PATH}/status`);
  return response?.data || null;
}

export async function completeOnboarding(input) {
  const response = await apiPost(
    `${ONBOARDING_BASE_PATH}/complete`,
    buildOnboardingPayload(input),
  );
  return response?.data || null;
}

export async function getOnboardingChecklistStatus() {
  const [servicesResponse, clientsResponse, appointmentsMeta] = await Promise.all([
    listServices({ page: 1, limit: CHECKLIST_LIMIT }),
    listClients({ page: 1, limit: CHECKLIST_LIMIT }),
    getAppointmentsMeta({ page: 1, limit: CHECKLIST_LIMIT }),
  ]);

  const counts = {
    services: Number(servicesResponse?.meta?.total || 0),
    clients: Number(clientsResponse?.meta?.total || 0),
    appointments: Number(appointmentsMeta?.total || 0),
  };
  const items = [
    toChecklistItem("service", counts.services > 0),
    toChecklistItem("client", counts.clients > 0),
    toChecklistItem("appointment", counts.appointments > 0),
  ];
  const completedCount = items.filter((item) => item.completed).length;

  return {
    counts,
    items,
    completedCount,
    pendingCount: items.length - completedCount,
    totalCount: items.length,
    isComplete: completedCount === items.length,
  };
}
