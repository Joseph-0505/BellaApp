import type { AuthSession, Nullable, UserProfile } from "../types/auth";
import { apiPost, clearSession, getSession, setSession, unwrapData } from "./api";
import { persistRefreshToken } from "./session-storage";

const AUTH_BASE_PATH = "/api/v1/auth";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  cpf: string;
  password: string;
  businessName?: string;
  cnpj?: string;
}

export async function register(payload: RegisterPayload): Promise<Nullable<UserProfile>> {
  const response = await apiPost(`${AUTH_BASE_PATH}/register`, payload, {
    auth: false,
  });

  return unwrapData<UserProfile>(response);
}

export async function login(credentials: LoginCredentials): Promise<Nullable<AuthSession>> {
  const response = await apiPost(`${AUTH_BASE_PATH}/login`, credentials, {
    auth: false,
  });

  return unwrapData<AuthSession>(response);
}

export async function loginAndStoreSession(
  credentials: LoginCredentials,
): Promise<Nullable<AuthSession>> {
  const session = await login(credentials);

  if (session) {
    setSession(session);
  }

  return session;
}

export async function logout(): Promise<void> {
  const session = getSession();
  clearSession();
  await persistRefreshToken(null);

  try {
    if (session?.refreshToken) {
      await apiPost(
        `${AUTH_BASE_PATH}/logout`,
        {
          refreshToken: session.refreshToken,
        },
        { auth: false },
      );
    }
  } catch {
    // No mobile, sair localmente e suficiente quando o backend estiver indisponivel.
  }
}
