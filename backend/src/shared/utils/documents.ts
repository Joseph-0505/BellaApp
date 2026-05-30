// Remove qualquer caractere que não seja número para padronizar CPF e CNPJ antes de salvar ou validar.
export function normalizeNumericString(value: string): string {
  return value.replace(/\D/g, "");
}

// Valida CPF a partir dos dígitos verificadores oficiais.
export function isValidCpf(value: string): boolean {
  const cpf = normalizeNumericString(value);

  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
    return false;
  }

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(cpf[index]) * (10 - index);
  }

  let remainder = (sum * 10) % 11;
  if (remainder === 10) {
    remainder = 0;
  }

  if (remainder !== Number(cpf[9])) {
    return false;
  }

  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number(cpf[index]) * (11 - index);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10) {
    remainder = 0;
  }

  return remainder === Number(cpf[10]);
}

// Valida CNPJ a partir dos dígitos verificadores oficiais.
export function isValidCnpj(value: string): boolean {
  const cnpj = normalizeNumericString(value);

  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) {
    return false;
  }

  const calculateDigit = (base: string, weights: number[]): number => {
    const sum = base.split("").reduce((accumulator, digit, index) => {
      const weight = weights[index] ?? 0;
      return accumulator + Number(digit) * weight;
    }, 0);

    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calculateDigit(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calculateDigit(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return `${firstDigit}${secondDigit}` === cnpj.slice(12);
}
