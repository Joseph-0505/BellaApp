// KAN-78 / Q-01: 20 req/s nas listagens principais com os mesmos filtros, contra a API local.
// Uso: scripts/load/run-q01.sh (roda o k6 e depois conta cache.hit/cache.miss no log do backend).
import http from "k6/http";
import exec from "k6/execution";
import { check, fail } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000/api/v1";
const RATE = Number(__ENV.RATE || 20);
const DURATION = __ENV.DURATION || "2m";
const LISTINGS = ["services", "clients", "professionals", "rooms", "appointments"];

export const options = {
  scenarios: {
    listagens: {
      executor: "constant-arrival-rate",
      rate: RATE,
      timeUnit: "1s",
      duration: DURATION,
      preAllocatedVUs: 10,
      maxVUs: 50,
    },
  },
  // SLOs de slo-observability.md; um limite por listagem faz o resumo mostrar o p95 de cada uma.
  thresholds: {
    http_req_failed: ["rate<0.005"],
    "http_req_duration{scenario:listagens}": ["p(95)<400"],
    ...Object.fromEntries(
      LISTINGS.map((name) => [`http_req_duration{listagem:${name}}`, ["p(95)<400"]]),
    ),
  },
  summaryTrendStats: ["avg", "med", "p(90)", "p(95)", "p(99)", "max"],
};

function cpf() {
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  for (const length of [9, 10]) {
    const sum = digits.slice(0, length).reduce((acc, n, i) => acc + n * (length + 1 - i), 0);
    const rest = (sum * 10) % 11;
    digits.push(rest === 10 ? 0 : rest);
  }
  return digits.join("");
}

function send(method, path, body, token) {
  const response = http.request(method, `${BASE_URL}${path}`, body ? JSON.stringify(body) : null, {
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    tags: { listagem: "setup" },
  });
  if (response.status >= 300) fail(`${method} ${path} respondeu ${response.status}: ${response.body}`);
  return response.json();
}

// Uma clínica nova por execução, com dados suficientes para páginas com conteúdo.
export function setup() {
  const email = `carga-${Date.now()}@example.invalid`;
  const password = "Carga@1234";
  send("POST", "/auth/register", { name: "Carga Q-01", email, password, cpf: cpf() });
  const token = send("POST", "/auth/login", { email, password }).data.token;
  send("POST", "/onboarding/complete", { businessName: "Clinica Carga" }, token);
  send("POST", "/billing/upgrade", { plan: "TEAM" }, token);

  const professionalId = send("GET", "/professionals?page=1&limit=10", null, token).data[0].id;
  send("POST", "/rooms", { name: "Sala Carga", active: true }, token);
  const services = Array.from({ length: 20 }, (_, i) =>
    send("POST", "/services", { name: `Servico ${i + 1}`, price: 100 + i, durationMinutes: 30, active: true }, token).data.id,
  );
  const clients = Array.from({ length: 20 }, (_, i) =>
    send("POST", "/clients", { name: `Cliente ${i + 1}`, phone: `(11) 90000-00${String(i).padStart(2, "0")}` }, token).data.id,
  );

  const day = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const date = day.toISOString().slice(0, 10);
  for (let hour = 10; hour < 20; hour += 1) {
    send("POST", "/appointments", {
      clientId: clients[hour - 10],
      serviceId: services[hour - 10],
      professionalId,
      scheduledAt: `${date}T${String(hour).padStart(2, "0")}:00:00.000Z`,
      status: "SCHEDULED",
    }, token);
  }

  return { token, date };
}

export default function ({ token, date }) {
  const name = LISTINGS[exec.scenario.iterationInTest % LISTINGS.length];
  const query = name === "appointments" ? `?date=${date}&page=1&limit=50` : "?page=1&limit=50";
  const response = http.get(`${BASE_URL}/${name}${query}`, {
    headers: { authorization: `Bearer ${token}` },
    tags: { listagem: name },
  });
  check(response, { "status 200": (r) => r.status === 200 });
}
