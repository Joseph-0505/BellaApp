const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ValidationInput = string | number | null | undefined;

function getDigits(value: ValidationInput, maxLength?: number): string {
  const digits = String(value || "").replace(/\D/g, "");

  if (typeof maxLength === "number") {
    return digits.slice(0, maxLength);
  }

  return digits;
}

export function isValidEmail(value: ValidationInput): boolean {
  return EMAIL_REGEX.test(
    String(value || "")
      .trim()
      .toLowerCase(),
  );
}

export function validateEmail(value: ValidationInput): string {
  if (!String(value || "").trim()) {
    return "Email é obrigatório.";
  }

  return isValidEmail(value) ? "" : "Email inválido.";
}

export function isValidCpf(value: ValidationInput): boolean {
  const cpf = getDigits(value, 11);

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

export function validateCpf(value: ValidationInput): string {
  if (!String(value || "").trim()) {
    return "CPF é obrigatório.";
  }

  return isValidCpf(value) ? "" : "CPF inválido.";
}

export function isValidCnpj(value: ValidationInput): boolean {
  const cnpj = getDigits(value, 14);

  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) {
    return false;
  }

  const weightsA = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weightsB = [6, ...weightsA];

  const calcDigit = (digits: number[], weights: number[]): number => {
    const total = digits.reduce(
      (sum, digit, index) => sum + digit * weights[index],
      0,
    );
    const remainder = total % 11;

    return remainder < 2 ? 0 : 11 - remainder;
  };

  const digits = cnpj.split("").map(Number);
  const firstDigit = calcDigit(digits.slice(0, 12), weightsA);

  if (firstDigit !== digits[12]) {
    return false;
  }

  const secondDigit = calcDigit(digits.slice(0, 13), weightsB);
  return secondDigit === digits[13];
}

export function validateCnpj(value: ValidationInput): string {
  if (!String(value || "").trim()) {
    return "";
  }

  return isValidCnpj(value) ? "" : "CNPJ inválido.";
}

export function validatePassword(value: ValidationInput): string {
  const password = String(value || "");

  if (password.length < 8) {
    return "A senha deve ter no mínimo 8 caracteres.";
  }

  if (password.length > 72) {
    return "A senha deve ter no máximo 72 caracteres.";
  }

  if (!/[a-z]/.test(password)) {
    return "A senha precisa ter pelo menos uma letra minúscula.";
  }

  if (!/[A-Z]/.test(password)) {
    return "A senha precisa ter pelo menos uma letra maiúscula.";
  }

  if (!/\d/.test(password)) {
    return "A senha precisa ter pelo menos um número.";
  }

  if (!/[^A-Za-z\d]/.test(password)) {
    return "A senha precisa ter pelo menos um símbolo.";
  }

  return "";
}

export function validatePasswordConfirmation(
  password: ValidationInput,
  confirmPassword: ValidationInput,
): string {
  return String(password || "") === String(confirmPassword || "")
    ? ""
    : "As senhas não coincidem.";
}

export { EMAIL_REGEX };
