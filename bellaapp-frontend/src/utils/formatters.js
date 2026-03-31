export default function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

export function formatPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{0,4}).*$/, (_, ddd, prefix, suffix) =>
      suffix ? `(${ddd}) ${prefix}-${suffix}` : `(${ddd}) ${prefix}`
    );
  }

  return digits.replace(/^(\d{2})(\d{5})(\d{0,4}).*$/, (_, ddd, prefix, suffix) =>
    suffix ? `(${ddd}) ${prefix}-${suffix}` : `(${ddd}) ${prefix}`
  );
}

function formatDuration(minutes) {
  if (minutes % 60 === 0) {
    return `${minutes / 60}h`;
  }

  return `${minutes}min`;
}