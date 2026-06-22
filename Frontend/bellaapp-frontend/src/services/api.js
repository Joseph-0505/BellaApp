// Base relativa ("") em dev E em produção: as requisições saem na mesma origem e são
// roteadas pelo proxy (Vite em dev, Nginx /api/ em produção), evitando CORS e mixed-content.
// VITE_API_URL permite sobrescrever para apontar a um backend externo, se necessário.
const DEFAULT_API_BASE_URL = "";
const API_BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
const SESSION_STORAGE_KEY = "bellaapp.session";
const SESSION_CHANGE_EVENT = "bellaapp:session-change";
const AUTH_BASE_PATH = "/api/v1/auth";
const TOKEN_REFRESH_WINDOW_MS = 15000;

let refreshInFlightPromise = null;

export class ApiError extends Error {
  constructor(message, { code = "API_ERROR", details = null, status = 500 } = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

function hasWindow() {
  return typeof window !== "undefined";
}

function notifySessionChange(session) {
  if (!hasWindow()) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(SESSION_CHANGE_EVENT, {
      detail: session,
    }),
  );
}

function readStoredSession() {
  if (!hasWindow()) {
    return null;
  }

  const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession);
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

function writeStoredSession(session) {
  if (!hasWindow()) {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    notifySessionChange(null);
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  notifySessionChange(session);
}

function buildUrl(path, query) {
  const url = new URL(path, `${API_BASE_URL}/`);

  if (!query) {
    return url.toString();
  }

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        url.searchParams.append(key, String(item));
      });
      return;
    }

    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

function decodeBase64Url(value) {
  const normalizedValue = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalizedValue.length % 4;
  const paddedValue = padding === 0 ? normalizedValue : `${normalizedValue}${"=".repeat(4 - padding)}`;

  if (hasWindow() && typeof window.atob === "function") {
    return window.atob(paddedValue);
  }

  return "";
}

function readTokenExpirationInMs(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  const tokenParts = token.split(".");
  if (tokenParts.length < 2) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(tokenParts[1]));
    if (typeof payload?.exp !== "number") {
      return null;
    }

    return payload.exp * 1000;
  } catch {
    return null;
  }
}

function shouldRefreshAccessToken(token) {
  const expirationInMs = readTokenExpirationInMs(token);

  if (!expirationInMs) {
    return false;
  }

  return Date.now() >= expirationInMs - TOKEN_REFRESH_WINDOW_MS;
}

async function refreshSessionIfNeeded(force = false) {
  const currentSession = getSession();

  if (!currentSession?.refreshToken) {
    return null;
  }

  if (!force && !shouldRefreshAccessToken(currentSession.token)) {
    return currentSession;
  }

  if (!refreshInFlightPromise) {
    refreshInFlightPromise = (async () => {
      const refreshResponse = await fetch(buildUrl(`${AUTH_BASE_PATH}/refresh`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: currentSession.refreshToken }),
      });

      const refreshResponseBody = await parseResponseBody(refreshResponse);

      if (!refreshResponse.ok) {
        clearSession();
        const { code, details, message } = extractErrorPayload(refreshResponseBody);
        throw new ApiError(message, {
          code,
          details,
          status: refreshResponse.status,
        });
      }

      const refreshedSession = refreshResponseBody?.data || null;

      if (!refreshedSession?.token) {
        clearSession();
        return null;
      }

      setSession(refreshedSession);
      return refreshedSession;
    })().finally(() => {
      refreshInFlightPromise = null;
    });
  }

  return refreshInFlightPromise;
}

async function parseResponseBody(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : null;
}

function extractErrorPayload(body) {
  if (!body || typeof body !== "object") {
    return {};
  }

  const apiError = body.error && typeof body.error === "object" ? body.error : null;
  const details = apiError?.details || body.details || null;
  const detailMessages = Array.isArray(details)
    ? details
        .map((detail) => (detail && typeof detail === "object" ? detail.message : ""))
        .filter(Boolean)
    : [];
  const fallbackMessage = detailMessages.length > 0 ? detailMessages.join(" ") : "Erro na requisição.";
  const rawMessage = apiError?.message || body.message || fallbackMessage;
  const message =
    ["Dados invalidos.", "Dados inválidos."].includes(rawMessage) && detailMessages.length > 0
      ? detailMessages.join(" ")
      : rawMessage;

  return {
    code: apiError?.code || body.code || "API_ERROR",
    details,
    message,
  };
}

async function request(path, options = {}) {
  const { auth = true, body, headers = {}, method = "GET", query, __skip401Retry = false, ...rest } = options;
  const session = auth ? await refreshSessionIfNeeded(false).catch(() => getSession()) : null;
  const token = auth ? session?.token || getAccessToken() : "";
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const resolvedHeaders = {
    ...(isFormData ? {} : body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  let response;

  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: resolvedHeaders,
      ...(body !== undefined ? { body: isFormData ? body : JSON.stringify(body) } : {}),
      ...rest,
    });
  } catch (networkError) {
    throw new ApiError("Não foi possível conectar ao servidor.", {
      code: "NETWORK_ERROR",
      details: networkError,
      status: 0,
    });
  }

  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    if (auth && response.status === 401 && !__skip401Retry) {
      try {
        const refreshedSession = await refreshSessionIfNeeded(true);

        if (refreshedSession?.token) {
          return request(path, { ...options, __skip401Retry: true });
        }
      } catch {
        // A limpeza da sessão já foi feita no fluxo de refresh.
      }
    }

    if (auth && response.status === 401) {
      clearSession();
    }

    const { code, details, message } = extractErrorPayload(responseBody);
    throw new ApiError(message, {
      code,
      details,
      status: response.status,
    });
  }

  return responseBody;
}

export function getSession() {
  return readStoredSession();
}

export function setSession(session) {
  writeStoredSession(session);
}

export function clearSession() {
  writeStoredSession(null);
}

export function updateSessionUser(user) {
  const session = getSession();

  if (!session) {
    return null;
  }

  const nextSession = {
    ...session,
    user,
  };

  setSession(nextSession);
  return nextSession;
}

export function getAccessToken() {
  return getSession()?.token || "";
}

export function getCurrentUser() {
  return getSession()?.user || null;
}

export function isAuthenticated() {
  return Boolean(getAccessToken());
}

export function apiGet(path, options = {}) {
  return request(path, { ...options, method: "GET" });
}

export function apiPost(path, body, options = {}) {
  return request(path, { ...options, body, method: "POST" });
}

export function apiPut(path, body, options = {}) {
  return request(path, { ...options, body, method: "PUT" });
}

export function apiDelete(path, options = {}) {
  return request(path, { ...options, method: "DELETE" });
}

export { API_BASE_URL, SESSION_CHANGE_EVENT, SESSION_STORAGE_KEY };
