export function buildAuthHeaders(userId = "user-1"): Record<string, string> {
  return {
    "x-test-user-id": userId,
  };
}

export function parseJson<T>(body: string): T {
  return JSON.parse(body) as T;
}
