import { apiGet, apiPost, apiPut } from "./api";
import { listClients } from "./clientService";
import { listProfessionals } from "./professionalService";
import { getRooms } from "./roomService";
import { listServices } from "./serviceService";
import {
  DEFAULT_TIME_SLOTS,
  createOccupiedSlotKeySet,
  getAppointmentEndHour,
} from "../utils/timeUtils";
import {
  mapBillingStatusFromApi,
  mapReceivedByFromApi,
  mapReceivedByToApi,
} from "../utils/financeUtils";

const APPOINTMENTS_BASE_PATH = "/api/v1/appointments";
const APPOINTMENT_CATALOG_LIMIT = 100;

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

function buildDefaultMeta(page = 1, limit = 1) {
  return {
    page,
    limit,
    total: 0,
    totalPages: 0,
  };
}

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

function toBillingSummary(billing) {
  if (!billing) {
    return null;
  }

  return {
    id: billing.id,
    amount: Number(billing.amount || 0),
    paidAmount: Number(billing.paidAmount || 0),
    remainingAmount: Number(billing.remainingAmount || 0),
    receivedBy: mapReceivedByFromApi(billing.receivedBy),
    status: mapBillingStatusFromApi(billing.status),
  };
}

function buildScheduledAt(date, hour) {
  return new Date(`${date}T${hour}:00`).toISOString();
}

function sortByScheduledAt(a, b) {
  return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
}

async function getAppointmentCatalog() {
  const [clientsResponse, servicesResponse, professionalsResponse, roomsResponse] = await Promise.all([
    listClients({ page: 1, limit: APPOINTMENT_CATALOG_LIMIT }),
    listServices({ page: 1, limit: APPOINTMENT_CATALOG_LIMIT }),
    listProfessionals({ page: 1, limit: APPOINTMENT_CATALOG_LIMIT }),
    getRooms({ page: 1, limit: APPOINTMENT_CATALOG_LIMIT }),
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

  const allRooms = roomsResponse.items
    .map((room) => ({
      id: room.id,
      name: room.name,
      color: room.color,
      active: room.active,
    }));
  const rooms = allRooms.filter((room) => room.active);

  return {
    clients,
    professionals: allProfessionals.filter((professional) => professional.status === "ativo"),
    rooms,
    services,
    clientById: new Map(clientsResponse.items.map((client) => [client.id, client])),
    professionalById: new Map(allProfessionals.map((professional) => [professional.id, professional])),
    roomById: new Map(allRooms.map((room) => [room.id, room])),
    serviceById: new Map(services.map((service) => [service.id, service])),
  };
}

export async function getAppointmentReferences() {
  const catalog = await getAppointmentCatalog();

  return {
    clients: catalog.clients,
    professionals: catalog.professionals,
    rooms: catalog.rooms,
    services: catalog.services.filter((service) => service.active),
  };
}

function toAgendaAppointment(appointment, catalog) {
  const client = catalog.clientById.get(appointment.clientId);
  const professional = catalog.professionalById.get(appointment.professionalId);
  const room = catalog.roomById.get(appointment.roomId);
  const service = catalog.serviceById.get(appointment.serviceId);
  const billingAmount = Number(appointment.billingAmount ?? service?.price ?? 0);
  const outstandingAmount =
    appointment.outstandingAmount === null || appointment.outstandingAmount === undefined
      ? null
      : Number(appointment.outstandingAmount);
  const receivedAmount =
    outstandingAmount === null ? 0 : Math.max(0, billingAmount - outstandingAmount);

  return {
    id: appointment.id,
    clientId: appointment.clientId,
    professionalId: appointment.professionalId || "",
    roomId: appointment.roomId || "",
    serviceId: appointment.serviceId,
    scheduledAt: appointment.scheduledAt,
    day: toIsoLocal(new Date(appointment.scheduledAt)),
    hour: formatHour(appointment.scheduledAt),
    cliente: client?.name || "Cliente não encontrado",
    servico: service?.name || "Serviço não encontrado",
    profissional: professional?.name || "",
    sala: appointment.roomId ? room?.name || "Sala não encontrada" : "",
    status: mapApiStatusToUi(appointment.status),
    valorEstimado: Number(service?.price || 0),
    valorRecebido: receivedAmount,
    duracaoMin: Number(service?.durationMinutes || 0),
    endHour: getAppointmentEndHour({
      hour: formatHour(appointment.scheduledAt),
      duracaoMin: Number(service?.durationMinutes || 0),
    }),
    observacoes: appointment.notes || "",
    notes: appointment.notes || "",
    receivedBy: mapReceivedByFromApi(appointment.receivedBy),
    billingId: appointment.billingId || "",
    billingAmount,
    paymentStatus: mapBillingStatusFromApi(appointment.billingStatus),
    outstandingAmount,
  };
}

async function fetchAppointmentsByDates(dates, professionalId) {
  const responses = await Promise.all(
    dates.map((date) =>
      apiGet(APPOINTMENTS_BASE_PATH, {
        query: {
          page: 1,
          limit: 100,
          date,
          ...(professionalId ? { professionalId } : {}),
        },
      })
    )
  );

  return responses.flatMap((response) => response?.data || []);
}

export async function getAppointmentsMeta({ date, limit = 1, page = 1, professionalId, status } = {}) {
  const response = await apiGet(APPOINTMENTS_BASE_PATH, {
    query: {
      page,
      limit,
      ...(date ? { date } : {}),
      ...(professionalId ? { professionalId } : {}),
      ...(status ? { status } : {}),
    },
  });

  return response?.meta || buildDefaultMeta(page, limit);
}

export async function getAgendaData(referenceDate = new Date(), options = {}) {
  const dates = getWeekDates(referenceDate);
  const catalog = await getAppointmentCatalog();
  const appointments = await fetchAppointmentsByDates(dates, options.professionalId);

  return {
    hours: DEFAULT_TIME_SLOTS,
    appointments: appointments.map((appointment) => toAgendaAppointment(appointment, catalog)).sort(sortByScheduledAt),
    clients: catalog.clients,
    professionals: catalog.professionals,
    rooms: catalog.rooms,
    services: catalog.services.filter((service) => service.active),
  };
}

export async function createAppointment(input) {
  const payload = {
    clientId: input.clientId,
    serviceId: input.serviceId,
    professionalId: input.professionalId,
    ...(input.roomId ? { roomId: input.roomId } : {}),
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

export async function completeAppointment(id, { receivedBy } = {}) {
  const catalog = await getAppointmentCatalog();
  const response = await apiPost(`${APPOINTMENTS_BASE_PATH}/${id}/complete`, {
    ...(receivedBy ? { receivedBy: mapReceivedByToApi(receivedBy) } : {}),
  });

  return response?.data
    ? {
        appointment: response.data.appointment
          ? toAgendaAppointment(response.data.appointment, catalog)
          : null,
        billing: response.data.billing ? toBillingSummary(response.data.billing) : null,
      }
    : null;
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
  const nextRoomId =
    typeof changes === "object" && Object.prototype.hasOwnProperty.call(changes, "roomId")
      ? changes.roomId
      : currentAppointment.roomId;

  const payload = {
    clientId: currentAppointment.clientId,
    serviceId: currentAppointment.serviceId,
    professionalId: nextProfessionalId,
    ...(nextRoomId ? { roomId: nextRoomId } : {}),
    scheduledAt: buildScheduledAt(nextDay, nextHour),
    status: mapUiStatusToApi(nextStatus),
    ...(String(nextNotes || "").trim() ? { notes: String(nextNotes).trim() } : {}),
  };

  const catalog = await getAppointmentCatalog();
  const response = await apiPut(`${APPOINTMENTS_BASE_PATH}/${currentAppointment.id}`, payload);
  return response?.data ? toAgendaAppointment(response.data, catalog) : null;
}

export async function getDashboardData(referenceDate = new Date()) {
  const selectedDate = typeof referenceDate === "string" && referenceDate ? referenceDate : toIsoLocal(referenceDate);
  const catalog = await getAppointmentCatalog();
  const dayResponse = await apiGet(APPOINTMENTS_BASE_PATH, {
    query: { page: 1, limit: 100, date: selectedDate },
  });

  const dayAppointments = (dayResponse?.data || [])
    .map((appointment) => toAgendaAppointment(appointment, catalog))
    .sort((a, b) => a.hour.localeCompare(b.hour));

  const confirmados = dayAppointments.filter((appointment) => appointment.status === "confirmado").length;
  const pendentes = dayAppointments.filter((appointment) => appointment.status === "pendente").length;
  const cancelados = dayAppointments.filter((appointment) => appointment.status === "cancelado").length;
  const concluidos = dayAppointments.filter((appointment) => appointment.status === "concluido").length;
  const busySlotCount = createOccupiedSlotKeySet(dayAppointments, DEFAULT_TIME_SLOTS).size;
  const faturamentoPrevisto = dayAppointments
    .filter((appointment) => appointment.status !== "cancelado")
    .reduce((total, appointment) => total + Number(appointment.valorEstimado || 0), 0);
  const faturamentoRecebido = dayAppointments
    .reduce((total, appointment) => total + Number(appointment.valorRecebido || 0), 0);

  const countsByService = dayAppointments.reduce((accumulator, appointment) => {
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
      mensagem: `${pendentes} agendamentos aguardando confirmação nesta data.`,
    });
  }
  if (cancelados > 0) {
    alertas.push({
      id: "canceled-appointments",
      mensagem: `${cancelados} cancelamentos registrados nesta data.`,
    });
  }
  if (dayAppointments.length === 0) {
    alertas.push({
      id: "empty-agenda",
      mensagem: "Nenhum agendamento para esta data.",
    });
  }

  return {
    resumo: {
      agendamentosHoje: dayAppointments.length,
      confirmados,
      pendentes,
      cancelados,
      concluidos,
      taxaOcupacao:
        DEFAULT_TIME_SLOTS.length > 0 ? Math.round((busySlotCount / DEFAULT_TIME_SLOTS.length) * 100) : 0,
      faturamentoPrevisto,
      faturamentoRecebido,
      atualizadoEm: new Date().toISOString(),
    },
    agendaHoje: dayAppointments.map((appointment) => ({
      id: appointment.id,
      clientId: appointment.clientId,
      professionalId: appointment.professionalId,
      roomId: appointment.roomId,
      serviceId: appointment.serviceId,
      day: appointment.day,
      hour: appointment.hour,
      hora: appointment.hour,
      cliente: appointment.cliente,
      clienteNome: appointment.cliente,
      servico: appointment.servico,
      servicoNome: appointment.servico,
      profissional: appointment.profissional,
      profissionalNome: appointment.profissional,
      sala: appointment.sala,
      salaNome: appointment.sala,
      status: appointment.status,
      duracaoMin: appointment.duracaoMin,
      endHour: appointment.endHour,
      notes: appointment.notes,
      observacoes: appointment.observacoes,
      valorEstimado: appointment.valorEstimado,
    })),
    alertas,
    topServicos,
    references: {
      clients: catalog.clients,
      professionals: catalog.professionals,
      rooms: catalog.rooms,
      services: catalog.services.filter((service) => service.active),
    },
  };
}
