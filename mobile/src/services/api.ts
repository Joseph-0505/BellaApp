import Constants from "expo-constants";
import { Platform } from "react-native";

import type { AuthSession } from "../types/auth";

interface ExpoGoConfigLike {
  debuggerHost?: string;
}

function extractHost(value?: string | null) {
  if (!value) {
    return null;
  }

  const normalizedValue = value.includes("://") ? value : `http://${value}`;

  try {
    return new URL(normalizedValue).hostname;
  } catch {
    return null;
  }
}

function resolveExpoHost() {
  const expoGoDebuggerHost =
    Constants.expoGoConfig
    && typeof Constants.expoGoConfig === "object"
    && "debuggerHost" in Constants.expoGoConfig
      ? String((Constants.expoGoConfig as ExpoGoConfigLike).debuggerHost || "")
      : "";

  return extractHost(Constants.expoConfig?.hostUri) || extractHost(expoGoDebuggerHost);
}

function resolveDefaultApiBaseUrl() {
  const expoHost = resolveExpoHost();

  if (expoHost) {
    return `http://${expoHost}:3000`;
  }

  return Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";
}

const DEFAULT_API_BASE_URL = resolveDefaultApiBaseUrl();
const AUTH_BASE_PATH = "/api/v1/auth";

type QueryPrimitive = string | number | boolean;
type QueryValue = QueryPrimitive | QueryPrimitive[] | null | undefined;
type QueryParams = Record<string, QueryValue>;
type SessionListener = (session: AuthSession | null) => void;

interface ApiErrorOptions {
  code?: string;
  details?: unknown;
  status?: number;
}

interface RequestOptions extends Omit<RequestInit, "body" | "headers" | "method"> {
  auth?: boolean;
  body?: unknown;
  headers?: Record<string, string>;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  query?: QueryParams;
  skip401Retry?: boolean;
}

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_BASE_URL).replace(
  /\/+$/,
  "",
);

let currentSession: AuthSession | null = null;
let refreshInFlightPromise: Promise<AuthSession | null> | null = null;

const sessionListeners = new Set<SessionListener>();

export class ApiError extends Error {
  code: string;
  details: unknown;
  status: number;

  constructor(message: string, { code = "API_ERROR", details = null, status = 500 }: ApiErrorOptions = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

function notifySessionChange(session: AuthSession | null) {
  sessionListeners.forEach((listener) => listener(session));
}

function buildUrl(path: string, query?: QueryParams) {
  const url = new URL(path, `${API_BASE_URL}/`);

  if (!query) {
    return url.toString();
  }

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => url.searchParams.append(key, String(item)));
      return;
    }

    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

async function parseResponseBody(response: Response) {
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

function extractErrorPayload(body: unknown) {
  if (!body || typeof body !== "object") {
    return {
      code: "API_ERROR",
      details: null,
      message: "Erro na requisicao.",
    };
  }

  const typedBody = body as {
    code?: string;
    details?: unknown;
    error?: {
      code?: string;
      details?: unknown;
      message?: string;
    };
    message?: string;
  };
  const apiError = typedBody.error;
  const details = apiError?.details ?? typedBody.details ?? null;
  const detailMessages = Array.isArray(details)
    ? details
        .map((detail) =>
          detail && typeof detail === "object" && "message" in detail
            ? String(detail.message || "")
            : "",
        )
        .filter(Boolean)
    : [];
  const rawMessage =
    apiError?.message
    ?? typedBody.message
    ?? (detailMessages.length > 0 ? detailMessages.join(" ") : "Erro na requisicao.");

  return {
    code: apiError?.code ?? typedBody.code ?? "API_ERROR",
    details,
    message:
      ["Dados invalidos.", "Dados invalidos", "Dados inválidos.", "Dados inválidos"].includes(
        rawMessage,
      ) && detailMessages.length > 0
        ? detailMessages.join(" ")
        : rawMessage,
  };
}

async function refreshSession() {
  const session = getSession();

  if (!session?.refreshToken) {
    return null;
  }

  if (!refreshInFlightPromise) {
    refreshInFlightPromise = (async () => {
      const response = await fetch(buildUrl(`${AUTH_BASE_PATH}/refresh`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
      const responseBody = await parseResponseBody(response);

      if (!response.ok) {
        clearSession();

        const { code, details, message } = extractErrorPayload(responseBody);
        throw new ApiError(message, {
          code,
          details,
          status: response.status,
        });
      }

      const refreshedSession = unwrapData<AuthSession>(responseBody);

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

async function request(path: string, options: RequestOptions = {}) {
  const {
    auth = true,
    body,
    headers = {},
    method = "GET",
    query,
    skip401Retry = false,
    ...rest
  } = options;
  const session = auth ? getSession() : null;
  const token = auth ? session?.token || "" : "";
  const resolvedHeaders = {
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  let response: Response;

  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: resolvedHeaders,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      ...rest,
    });
  } catch (networkError) {
    throw new ApiError(
      `Nao foi possivel conectar ao servidor em ${API_BASE_URL}.`,
      {
      code: "NETWORK_ERROR",
      details: networkError,
      status: 0,
      },
    );
  }

  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    if (auth && response.status === 401 && !skip401Retry && session?.refreshToken) {
      try {
        const refreshedSession = await refreshSession();

        if (refreshedSession?.token) {
          return request(path, { ...options, skip401Retry: true });
        }
      } catch {
        // A sessao ja foi limpa no fluxo de refresh.
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

export function unwrapData<T>(value: unknown): T | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if ("data" in value) {
    return ((value as { data?: T | null }).data ?? null) as T | null;
  }

  return value as T;
}

export function getSession() {
  return currentSession;
}

export function setSession(session: AuthSession | null) {
  currentSession = session;
  notifySessionChange(session);
}

export function clearSession() {
  setSession(null);
}

export function updateSessionUser(user: AuthSession["user"]) {
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

export function subscribeToSessionChanges(listener: SessionListener) {
  sessionListeners.add(listener);

  return () => {
    sessionListeners.delete(listener);
  };
}

export function getAccessToken() {
  return getSession()?.token || "";
}

export function isAuthenticated() {
  return Boolean(getAccessToken());
}

export function apiGet(path: string, options: Omit<RequestOptions, "method"> = {}) {
  return request(path, { ...options, method: "GET" });
}

export function apiPost(
  path: string,
  body?: unknown,
  options: Omit<RequestOptions, "body" | "method"> = {},
) {
  return request(path, { ...options, body, method: "POST" });
}

export function apiPut(
  path: string,
  body?: unknown,
  options: Omit<RequestOptions, "body" | "method"> = {},
) {
  return request(path, { ...options, body, method: "PUT" });
}

export function apiDelete(path: string, options: Omit<RequestOptions, "method"> = {}) {
  return request(path, { ...options, method: "DELETE" });
}
