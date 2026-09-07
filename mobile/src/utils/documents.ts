type DocumentInput = string | number | null | undefined;

function getDigits(value: DocumentInput, maxLength: number) {
  return String(value || "").replace(/\D/g, "").slice(0, maxLength);
}

export function normalizeCpf(value: DocumentInput) {
  return getDigits(value, 11);
}

export function normalizeCnpj(value: DocumentInput) {
  return getDigits(value, 14);
}

export function formatCpf(value: DocumentInput) {
  const digits = normalizeCpf(value);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatCnpj(value: DocumentInput) {
  const digits = normalizeCnpj(value);

  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function isValidCpf(value: DocumentInput) {
  const cpf = normalizeCpf(value);

  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
    return false;
  }

  const calculateDigit = (length: number) => {
    const sum = cpf
      .slice(0, length)
      .split("")
      .reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0);
    const remainder = (sum * 10) % 11;

    return remainder === 10 ? 0 : remainder;
  };

  return calculateDigit(9) === Number(cpf[9]) && calculateDigit(10) === Number(cpf[10]);
}

export function isValidCnpj(value: DocumentInput) {
  const cnpj = normalizeCnpj(value);

  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) {
    return false;
  }

  const digits = cnpj.split("").map(Number);
  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const secondWeights = [6, ...firstWeights];
  const calculateDigit = (values: number[], weights: number[]) => {
    const remainder = values.reduce(
      (total, digit, index) => total + digit * weights[index],
      0,
    ) % 11;

    return remainder < 2 ? 0 : 11 - remainder;
  };

  return (
    calculateDigit(digits.slice(0, 12), firstWeights) === digits[12]
    && calculateDigit(digits.slice(0, 13), secondWeights) === digits[13]
  );
}
