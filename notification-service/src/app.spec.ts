import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "./app";

test("health responde 503 quando o Redis nao responde", async () => {
  const never = () => new Promise<never>(() => undefined);
  const app = buildApp({ ping: never } as never, { stats: never } as never);

  const response = await app.inject({ method: "GET", url: "/health" });

  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.json().dependencies, { redis: "down" });
  await app.close();
});
