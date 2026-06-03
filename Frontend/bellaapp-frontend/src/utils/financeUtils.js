export const RECEIVED_BY_OPTIONS = [
  {
    value: "clinica",
    label: "Clínica",
    description: "O valor entra no caixa do dia.",
  },
  {
    value: "profissional",
    label: "Profissional",
    description: "Não entra no caixa da clínica.",
  },
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: "pix", label: "Pix" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "credito", label: "Cartão de crédito" },
  { value: "debito", label: "Cartão de débito" },
  { value: "transferencia", label: "Transferência" },
  { value: "outro", label: "Outro" },
];

const API_TO_UI_RECEIVED_BY = {
  CLINIC: "clinica",
  PROFESSIONAL: "profissional",
};

const UI_TO_API_RECEIVED_BY = {
  clinica: "CLINIC",
  profissional: "PROFESSIONAL",
};

const API_TO_UI_BILLING_STATUS = {
  PENDING: "pendente",
  PARTIALLY_PAID: "parcial",
  PAID: "pago",
};

const API_TO_UI_PAYMENT_METHOD = {
  CASH: "dinheiro",
  PIX: "pix",
  CREDIT_CARD: "credito",
  DEBIT_CARD: "debito",
  TRANSFER: "transferencia",
  OTHER: "outro",
};

const UI_TO_API_PAYMENT_METHOD = {
  dinheiro: "CASH",
  pix: "PIX",
  credito: "CREDIT_CARD",
  debito: "DEBIT_CARD",
  transferencia: "TRANSFER",
  outro: "OTHER",
};

const BILLING_STATUS_LABELS = {
  pendente: "Pendente",
  parcial: "Parcial",
  pago: "Pago",
};

const PAYMENT_METHOD_LABELS = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  credito: "Cartão de crédito",
  debito: "Cartão de débito",
  transferencia: "Transferência",
  outro: "Outro",
};

export function mapReceivedByFromApi(value) {
  return API_TO_UI_RECEIVED_BY[value] || "clinica";
}

export function mapReceivedByToApi(value) {
  return UI_TO_API_RECEIVED_BY[value] || "CLINIC";
}

export function mapBillingStatusFromApi(value) {
  if (!value) {
    return null;
  }

  return API_TO_UI_BILLING_STATUS[value] || "pendente";
}

export function mapPaymentMethodFromApi(value) {
  if (!value) {
    return null;
  }

  return API_TO_UI_PAYMENT_METHOD[value] || "outro";
}

export function mapPaymentMethodToApi(value) {
  return UI_TO_API_PAYMENT_METHOD[value] || "PIX";
}

export function formatPaymentMethodLabel(value) {
  if (!value) {
    return "Sem forma registrada";
  }

  return PAYMENT_METHOD_LABELS[value] || String(value);
}

export function formatReceivedByLabel(value) {
  return value === "profissional" ? "Profissional" : "Clínica";
}

export function formatBillingStatusLabel(value) {
  if (!value) {
    return "Sem cobrança";
  }

  return BILLING_STATUS_LABELS[value] || String(value);
}