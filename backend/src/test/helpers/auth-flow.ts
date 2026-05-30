import { FastifyInstance } from "fastify";
import { parseJson } from "./http";

let sequence = 1;

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

function generateValidCpf(seed: number): string {
  const base = String(100000000 + seed).slice(0, 9).split("").map(Number);

  const calculateDigit = (digits: number[], factor: number): number => {
    const total = digits.reduce((sum, digit, index) => sum + digit * (factor - index), 0);
    const remainder = (total * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  const firstDigit = calculateDigit(base, 10);
  const secondDigit = calculateDigit([...base, firstDigit], 11);

  return [...base, firstDigit, secondDigit].join("");
}

export function makeUserPayload(overrides: Partial<{
  name: string;
  email: string;
  password: string;
  cpf: string;
}> = {}) {
  const current = sequence;
  sequence += 1;

  return {
    name: `Usuário Teste ${current}`,
    email: `usuario.${current}@bella.com`,
    password: "Senha@123",
    cpf: generateValidCpf(current),
    ...overrides,
  };
}

export async function registerUser(
  app: FastifyInstance,
  overrides: Partial<{
    name: string;
    email: string;
    password: string;
    cpf: string;
  }> = {},
) {
  const payload = makeUserPayload(overrides);
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    payload,
  });

  return {
    payload,
    response,
    body: response.body ? parseJson<{ data?: JsonValue; error?: JsonValue }>(response.body) : null,
  };
}

export async function loginUser(app: FastifyInstance, email: string, password: string) {
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: {
      email,
      password,
    },
  });

  return {
    response,
    body: response.body
      ? parseJson<{ data?: { token: string; refreshToken: string; user: { id: string } }; error?: JsonValue }>(response.body)
      : null,
  };
}

export async function createAuthenticatedUser(
  app: FastifyInstance,
  overrides: Partial<{
    name: string;
    email: string;
    password: string;
    cpf: string;
  }> = {},
) {
  const registered = await registerUser(app, overrides);

  if (registered.response.statusCode !== 201) {
    throw new Error(`Falha ao registrar usuário de teste: ${registered.response.body}`);
  }

  const logged = await loginUser(app, registered.payload.email, registered.payload.password);

  if (logged.response.statusCode !== 200 || !logged.body?.data?.token) {
    throw new Error(`Falha ao autenticar usuário de teste: ${logged.response.body}`);
  }

  return {
    user: registered.body?.data,
    credentials: registered.payload,
    token: logged.body.data.token,
    refreshToken: logged.body.data.refreshToken,
    userId: logged.body.data.user.id,
  };
}
