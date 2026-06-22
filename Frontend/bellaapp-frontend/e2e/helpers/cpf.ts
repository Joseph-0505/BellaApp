// Gera um CPF valido (com digitos verificadores corretos) e aleatorio.
// Usado para que o teste de cadastro seja idempotente: cada execucao usa
// um CPF diferente, evitando colisao (409 CPF_ALREADY_EXISTS) em re-runs.
export function generateCpf(): string {
  const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))

  const calcDigit = (digits: number[]): number => {
    const factorStart = digits.length + 1
    const sum = digits.reduce((acc, digit, index) => acc + digit * (factorStart - index), 0)
    const remainder = (sum * 10) % 11
    return remainder === 10 ? 0 : remainder
  }

  const firstDigit = calcDigit(base)
  const secondDigit = calcDigit([...base, firstDigit])
  const digits = [...base, firstDigit, secondDigit].join('')

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}
