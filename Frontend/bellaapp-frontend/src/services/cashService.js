import { apiGet, apiPost } from "./api";
import {
  formatPaymentMethodLabel,
  mapBillingStatusFromApi,
  mapPaymentMethodFromApi,
  mapPaymentMethodToApi,
  mapReceivedByFromApi,
} from "../utils/financeUtils";

const CASH_BASE_PATH = "/api/v1/caixa";
const BILLINGS_BASE_PATH = "/api/v1/cobrancas";

function formatDateLabel(isoDate) {
  if (!isoDate) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR").format(new Date(isoDate));
}

function formatHourLabel(isoDate) {
  if (!isoDate) {
    return "--:--";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

function toBillingViewModel(billing) {
  return {
    id: billing.id,
    appointmentId: billing.appointmentId || "",
    clientName: billing.clientName || "Cliente não informado",
    serviceName: billing.serviceName || "Serviço não informado",
    professionalName: billing.professionalName || "Profissional não vinculado",
    amount: Number(billing.amount || 0),
    paidAmount: Number(billing.paidAmount || 0),
    remainingAmount: Number(billing.remainingAmount || 0),
    status: mapBillingStatusFromApi(billing.status),
    receivedBy: mapReceivedByFromApi(billing.receivedBy),
    appointmentScheduledAt: billing.appointmentScheduledAt || "",
  };
}

function toMovementViewModel(movement) {
  const paymentMethod = mapPaymentMethodFromApi(movement.paymentMethod);

  return {
    id: movement.id,
    billingId: movement.billingId || "",
    type: movement.type === "EXPENSE" ? "saida" : "entrada",
    status: movement.status === "PENDING" ? "pendente" : "pago",
    description: movement.description || "Pagamento registrado",
    amount: Number(movement.amount || 0),
    countsInCash: Boolean(movement.countsInCash),
    clientName: movement.clientName || "Cliente não informado",
    serviceName: movement.serviceName || "Serviço não informado",
    professionalName: movement.professionalName || "Profissional não vinculado",
    occurredAt: movement.occurredAt || "",
    hourLabel: formatHourLabel(movement.occurredAt),
    paymentMethod,
    paymentMethodLabel: formatPaymentMethodLabel(paymentMethod),
  };
}

function toCashViewModel(cash) {
  return {
    id: cash.id,
    date: cash.date,
    dateLabel: formatDateLabel(cash.date),
    status: cash.status === "CLOSED" ? "fechado" : "aberto",
    scope: cash.scope === "PROFESSIONAL" ? "profissional" : "clinica",
    professionalId: cash.professionalId || "",
    professionalName: cash.professionalName || "",
    openingAmount: Number(cash.openingAmount || 0),
    totalPaid: Number(cash.totalPaid || 0),
    totalExpenses: Number(cash.totalExpenses || 0),
    totalBalance: Number(cash.totalBalance || 0),
    expectedClosingAmount: Number(cash.expectedClosingAmount || 0),
    informedClosingAmount:
      cash.informedClosingAmount === null || cash.informedClosingAmount === undefined
        ? null
        : Number(cash.informedClosingAmount),
    differenceAmount:
      cash.differenceAmount === null || cash.differenceAmount === undefined
        ? null
        : Number(cash.differenceAmount),
    openedAt: cash.openedAt || "",
    closedAt: cash.closedAt || null,
    movements: Array.isArray(cash.movements) ? cash.movements.map(toMovementViewModel) : [],
  };
}

export async function payBilling(id, input) {
  const response = await apiPost(`${BILLINGS_BASE_PATH}/${id}/pagar`, {
    amount: Number(input.amount || 0),
    paymentMethod: mapPaymentMethodToApi(input.paymentMethod),
    ...(String(input.notes || "").trim() ? { notes: String(input.notes).trim() } : {}),
  });

  return response?.data
    ? {
        billing: toBillingViewModel(response.data.billing),
        movement: toMovementViewModel(response.data.movement),
      }
    : null;
}

export async function getTodayCash({ professionalId } = {}) {
  const response = await apiGet(CASH_BASE_PATH, {
    query: {
      ...(professionalId ? { professionalId } : {}),
    },
  });
  return response?.data ? toCashViewModel(response.data) : null;
}

export async function openTodayCash({ professionalId, openingAmount }) {
  const response = await apiPost(`${CASH_BASE_PATH}/abrir`, {
    openingAmount: Number(openingAmount || 0),
    ...(professionalId ? { professionalId } : {}),
  });

  return response?.data ? toCashViewModel(response.data) : null;
}

export async function closeTodayCash({ professionalId, informedClosingAmount }) {
  const response = await apiPost(`${CASH_BASE_PATH}/fechar`, {
    informedClosingAmount: Number(informedClosingAmount || 0),
    ...(professionalId ? { professionalId } : {}),
  });

  return response?.data ? toCashViewModel(response.data) : null;
}