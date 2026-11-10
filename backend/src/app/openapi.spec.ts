import { buildApp } from "./app";

describe("OpenAPI HTTP documentation", () => {
  const app = buildApp();

  afterAll(async () => {
    await app.close();
  });

  it("serves an interactive Swagger UI", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/docs/",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.body).toContain("Swagger UI");
  });

  it("publishes the versioned OpenAPI contract", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/docs/json",
    });

    expect(response.statusCode).toBe(200);

    const contract = response.json<{
      paths: Record<string, Record<string, unknown>>;
    }>();

    expect(contract).toEqual(expect.objectContaining({
      openapi: "3.0.3",
      info: expect.objectContaining({ title: "BellaApp API" }),
      paths: expect.objectContaining({
        "/api/v1/auth/login": expect.any(Object),
        "/api/v1/appointments": expect.any(Object),
      }),
    }));

    const documentedMethods = ["get", "post", "put", "patch", "delete"] as const;

    for (const [openApiPath, operations] of Object.entries(contract.paths)) {
      const fastifyPath = openApiPath.replace(/\{([^}]+)\}/g, ":$1");

      for (const method of documentedMethods) {
        if (operations[method]) {
          expect(app.hasRoute({
            method: method.toUpperCase() as Uppercase<typeof method>,
            url: fastifyPath,
          })).toBe(true);
        }
      }
    }
  });
});
