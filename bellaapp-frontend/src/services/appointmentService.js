import { apiGet, apiPost, apiPut } from "./api";
import { listClients } from "./clientService";
import { listProfessionals } from "./professionalService";
import { listServices } from "./serviceService";

const APPOINTMENTS_BASE_PATH = "/api/v1/appointments";
const DEFAULT_HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

const API_TO_UI_STATUS = {
  SCHEDULED: "pendente",
  CONFIRMED: "confirmado",
  COMPLETED: "concluido",
  CANCELED: "cancelado",
};

const UI_TO_API_STATUS = {
  pendente: "SCHEDULED",
  confirmado: "CONFIRMED",
  concluido: "COMPLETED",
  cancelado: "CANCELED",
};

function toIsoLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonday(baseDate) {
  const date = new Date(baseDate);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getWeekDates(baseDate) {
  const monday = getMonday(baseDate);
  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(monday);
    next.setDate(monday.getDate() + index);
    return toIsoLocal(next);
  });
}

function formatHour(isoDate) {
  return new Date(isoDate).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function mapApiStatusToUi(status) {
  return API_TO_UI_STATUS[status] || "pendente";
}

function mapUiStatusToApi(status) {
  return UI_TO_API_STATUS[status] || "SCHEDULED";
}

function buildScheduledAt(date, hour) {
  return new Date(`${date}T${hour}:00`).toISOString();
}

function sortByScheduledAt(a, b) {
  return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
}

async function getAppointmentCatalog() {
  const [clientsResponse, servicesResponse, professionalsResponse] = await Promise.all([
    listClients({ page: 1, limit: 100 }),
    listServices({ page: 1, limit: 100 }),
    listProfessionals({ page: 1, limit: 100 }),
  ]);

  const clients = clientsResponse.items.map((client) => ({
    id: client.id,
    name: client.name,
  }));

  const services = servicesResponse.items.map((service) => ({
    id: service.id,
    name: service.name,
    price: Number(service.price || 0),
    durationMinutes: Number(service.durationMinutes || 0),
    active: service.active,
  }));

  const allProfessionals = professionalsResponse.items.map((professional) => ({
    id: professional.id,
    name: professional.name,
    specialty: professional.specialty,
    status: professional.status,
  }));

  return {
    clients,
    professionals: allProfessionals.filter((professional) => professional.status === "ativo"),
    services,
    clientById: new Map(clientsResponse.items.map((client) => [client.id, client])),
    professionalById: new Map(allProfessionals.map((professional) => [professional.id, professional])),
    serviceById: new Map(services.map((service) => [service.id, service])),
  };
}

function toAgendaAppointment(appointment, catalog) {
  const client = catalog.clientById.get(appointment.clientId);
  const professional = catalog.professionalById.get(appointment.professionalId);
  const service = catalog.serviceById.get(appointment.serviceId);

  return {
    id: appointment.id,
    clientId: appointment.clientId,
    professionalId: appointment.professionalId || "",
    serviceId: appointment.serviceId,
    scheduledAt: appointment.scheduledAt,
    day: toIsoLocal(new Date(appointment.scheduledAt)),
    hour: formatHour(appointment.scheduledAt),
    cliente: client?.name || "Cliente nao encontrado",
    servico: service?.name || "Servico nao encontrado",
    profissional: professional?.name || "",
    status: mapApiStatusToUi(appointment.status),
    valorEstimado: Number(service?.price || 0),
    duracaoMin: Number(service?.durationMinutes || 0),
    observacoes: appointment.notes || "",
    notes: appointment.notes || "",
  };
}

async function fetchAppointmentsByDates(dates) {
  const responses = await Promise.all(
    dates.map((date) =>
      apiGet(APPOINTMENTS_BASE_PATH, {
        query: {
          page: 1,
          limit: 100,
          date,
        },
      })
    )
  );

  return responses.flatMap((response) => response?.data || []);
}

export async function getAgendaData(referenceDate = new Date()) {
  const dates = getWeekDates(referenceDate);
  const catalog = await getAppointmentCatalog();
  const appointments = await fetchAppointmentsByDates(dates);

  return {
    hours: DEFAULT_HOURS,
    appointments: appointments.map((appointment) => toAgendaAppointment(appointment, catalog)).sort(sortByScheduledAt),
    clients: catalog.clients,
    professionals: catalog.professionals,
    services: catalog.services.filter((service) => service.active),
  };
}

export async function createAppointment(input) {
  const payload = {
    clientId: input.clientId,
    serviceId: input.serviceId,
    ...(input.professionalId ? { professionalId: input.professionalId } : {}),
    scheduledAt: buildScheduledAt(input.day || input.data, input.hour || input.hora),
    status: mapUiStatusToApi(input.status),
    ...(String(input.notes || input.observacoes || "").trim()
      ? { notes: String(input.notes || input.observacoes).trim() }
      : {}),
  };

  const catalog = await getAppointmentCatalog();
  const response = await apiPost(APPOINTMENTS_BASE_PATH, payload);
  return response?.data ? toAgendaAppointment(response.data, catalog) : null;
}

export async function updateAppointment(currentAppointment, changes) {
  const nextStatus =
    typeof changes === "string" ? changes : changes.status || currentAppointment.status;
  const nextDay = typeof changes === "object" && changes.day ? changes.day : currentAppointment.day;
  const nextHour = typeof changes === "object" && changes.hour ? changes.hour : currentAppointment.hour;
  const nextNotes =
    typeof changes === "object" && Object.prototype.hasOwnProperty.call(changes, "notes")
      ? changes.notes
      : typeof changes === "object" && Object.prototype.hasOwnProperty.call(changes, "observacoes")
        ? changes.observacoes
        : currentAppointment.notes || currentAppointment.observacoes || "";
  const nextProfessionalId =
    typeof changes === "object" && Object.prototype.hasOwnProperty.call(changes, "professionalId")
      ? changes.professionalId
      : currentAppointment.professionalId;

  const payload = {
    clientId: currentAppointment.clientId,
    serviceId: currentAppointment.serviceId,
    ...(nextProfessionalId ? { professionalId: nextProfessionalId } : {}),
    scheduledAt: buildScheduledAt(nextDay, nextHour),
    status: mapUiStatusToApi(nextStatus),
    ...(String(nextNotes || "").trim() ? { notes: String(nextNotes).trim() } : {}),
  };

  const catalog = await getAppointmentCatalog();
  const response = await apiPut(`${APPOINTMENTS_BASE_PATH}/${currentAppointment.id}`, payload);
  return response?.data ? toAgendaAppointment(response.data, catalog) : null;
}

export async function getDashboardData() {
  const today = toIsoLocal(new Date());
  const catalog = await getAppointmentCatalog();
  const [todayResponse, latestResponse] = await Promise.all([
    apiGet(APPOINTMENTS_BASE_PATH, {
      query: { page: 1, limit: 100, date: today },
    }),
    apiGet(APPOINTMENTS_BASE_PATH, {
      query: { page: 1, limit: 100 },
    }),
  ]);

  const todayAppointments = (todayResponse?.data || [])
    .map((appointment) => toAgendaAppointment(appointment, catalog))
    .sort((a, b) => a.hour.localeCompare(b.hour));

  const latestAppointments = (latestResponse?.data || []).map((appointment) => toAgendaAppointment(appointment, catalog));

  const confirmados = todayAppointments.filter((appointment) => appointment.status === "confirmado").length;
  const pendentes = todayAppointments.filter((appointment) => appointment.status === "pendente").length;
  const cancelados = todayAppointments.filter((appointment) => appointment.status === "cancelado").length;
  const concluidos = todayAppointments.filter((appointment) => appointment.status === "concluido").length;
  const faturamentoPrevisto = todayAppointments
    .filter((appointment) => appointment.status !== "cancelado")
    .reduce((total, appointment) => total + Number(appointment.valorEstimado || 0), 0);
  const faturamentoRecebido = todayAppointments
    .filter((appointment) => appointment.status === "concluido")
    .reduce((total, appointment) => total + Number(appointment.valorEstimado || 0), 0);

  const countsByService = latestAppointments.reduce((accumulator, appointment) => {
    accumulator.set(appointment.servico, (accumulator.get(appointment.servico) || 0) + 1);
    return accumulator;
  }, new Map());

  const maxCount = Math.max(...countsByService.values(), 0);
  const topServicos = Array.from(countsByService.entries())
    .map(([servicoNome, quantidade]) => ({
      servicoNome,
      quantidade,
      percentual: maxCount > 0 ? Math.round((quantidade / maxCount) * 100) : 0,
    }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 4);

  const alertas = [];
  if (pendentes > 0) {
    alertas.push({
      id: "pending-appointments",
      mensagem: `${pendentes} agendamentos aguardando confirmacao hoje.`,
    });
  }
  if (cancelados > 0) {
    alertas.push({
      id: "canceled-appointments",
      mensagem: `${cancelados} cancelamentos registrados hoje.`,
    });
  }
  if (todayAppointments.length === 0) {
    alertas.push({
      id: "empty-agenda",
      mensagem: "Nenhum agendamento para hoje.",
    });
  }

  return {
    resumo: {
      agendamentosHoje: todayAppointments.length,
      confirmados,
      pendentes,
      cancelados,
      concluidos,
      taxaOcupacao: Math.round((todayAppointments.length / DEFAULT_HOURS.length) * 100),
      faturamentoPrevisto,
      faturamentoRecebido,
      atualizadoEm: new Date().toISOString(),
    },
    agendaHoje: todayAppointments.map((appointment) => ({
      id: appointment.id,
      clientId: appointment.clientId,
      professionalId: appointment.professionalId,
      serviceId: appointment.serviceId,
      day: appointment.day,
      hour: appointment.hour,
      hora: appointment.hour,
      clienteNome: appointment.cliente,
      servicoNome: appointment.servico,
      profissionalNome: appointment.profissional,
      status: appointment.status,
      observacoes: appointment.observacoes,
      valorEstimado: appointment.valorEstimado,
    })),
    alertas,
    topServicos,
    references: {
      clients: catalog.clients,
      professionals: catalog.professionals,
      services: catalog.services.filter((service) => service.active),
    },
  };
}
