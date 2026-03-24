import { apiPost, clearSession, setSession } from "./api";

const AUTH_BASE_PATH = "/api/v1/auth";

export async function register(payload) {
  const response = await apiPost(`${AUTH_BASE_PATH}/register`, payload, {
    auth: false,
  });

  return response?.data || null;
}

export async function login(credentials) {
  const response = await apiPost(`${AUTH_BASE_PATH}/login`, credentials, {
    auth: false,
  });

  return response?.data || null;
}

export async function loginAndStoreSession(credentials) {
  const session = await login(credentials);
  setSession(session);
  return session;
}

export function logout() {
  clearSession();
}
