const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function request(path, options = {}) {
  const response = await fetch(API_BASE_URL + path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = "Erro na requisicao";
    try {
      const body = await response.json();
      message = body.message || message;
    } catch (_) {
      const text = await response.text();
      if (text) message = text;
    }
    throw new Error(message);
  }

  return response.json();
}

export function apiGet(path) {
  return request(path, { method: "GET" });
}

export { API_BASE_URL };