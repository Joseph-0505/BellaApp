type FormatterInput = string | number | null | undefined;

export default function formatCurrency(value: FormatterInput): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

function getDigits(value: FormatterInput, maxLength?: number): string {
  const digits = String(value || "").replace(/\D/g, "");

  if (typeof maxLength === "number") {
    return digits.slice(0, maxLength);
  }

  return digits;
}

export function formatPhone(value: FormatterInput): string {
  const digits = getDigits(value, 11);

  if (!digits) {
    return "";
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  const ddd = digits.slice(0, 2);
  const phoneNumber = digits.slice(2);
  const prefixLength = digits.length > 10 ? 5 : 4;
  const prefix = phoneNumber.slice(0, prefixLength);
  const suffix = phoneNumber.slice(prefixLength);

  if (!suffix) {
    return `(${ddd}) ${prefix}`;
  }

  return `(${ddd}) ${prefix}-${suffix}`;
}

function formatDuration(minutes: FormatterInput): string {
  const totalMinutes = Number(minutes || 0);

  if (totalMinutes > 0 && totalMinutes % 60 === 0) {
    return `${totalMinutes / 60}h`;
  }

  return `${totalMinutes}min`;
}

export function formatCpf(value: FormatterInput): string {
  const digits = getDigits(value, 11);

  if (!digits) {
    return "";
  }

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatCnpj(value: FormatterInput): string {
  const digits = getDigits(value, 14);

  if (!digits) {
    return "";
  }

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 5) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  }

  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  }

  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function normalizeCpf(value: FormatterInput): string {
  return getDigits(value, 11);
}

export function normalizeCnpj(value: FormatterInput): string {
  return getDigits(value, 14);
}

export function normalizeEmail(value: FormatterInput): string {
  return String(value || "").replace(/\s+/g, "").toLowerCase();
}

export { formatDuration };
