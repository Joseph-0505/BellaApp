import { FastifyInstance } from "fastify";

export async function completeOnboardingAsTeam(
  app: FastifyInstance,
  token: string,
  overrides: Partial<{
    businessName: string;
  }> = {},
) {
  return app.inject({
    method: "POST",
    url: "/api/v1/onboarding/complete",
    headers: {
      authorization: `Bearer ${token}`,
    },
    payload: {
      businessName: "Bella Team",
      ...overrides,
    },
  });
}
