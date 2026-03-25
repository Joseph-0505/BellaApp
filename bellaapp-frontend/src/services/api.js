const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/+$/, "");
const SESSION_STORAGE_KEY = "bellaapp.session";

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
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
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
  const fallbackMessage =
    detailMessages.length > 0
      ? detailMessages.join(" ")
      : "Erro na requisicao.";
  const rawMessage = apiError?.message || body.message || fallbackMessage;
  const message =
    rawMessage === "Dados invalidos." && detailMessages.length > 0
      ? detailMessages.join(" ")
      : rawMessage;

  return {
    code: apiError?.code || body.code || "API_ERROR",
    details,
    message,
  };
}

async function request(path, options = {}) {
  const {
    auth = true,
    body,
    headers = {},
    method = "GET",
    query,
    ...rest
  } = options;

  const token = auth ? getAccessToken() : "";
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const resolvedHeaders = {
    ...(isFormData ? {} : body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: resolvedHeaders,
    ...(body !== undefined ? { body: isFormData ? body : JSON.stringify(body) } : {}),
    ...rest,
  });

  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
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

export { API_BASE_URL, SESSION_STORAGE_KEY };
