export type DependencyHealth = {
  latencyMs: number;
  status: "disabled" | "down" | "up";
};

export type HealthResponseDto = {
  status: "down" | "ok";
  timestamp: string;
  uptimeSeconds: number;
  dependencies: {
    mysql: DependencyHealth;
    redis: DependencyHealth;
  };
};
