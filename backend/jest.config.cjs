module.exports = {
  testEnvironment: "node",
  globalSetup: "<rootDir>/jest.global-setup.cjs",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.spec.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  clearMocks: true,
  setupFiles: ["<rootDir>/src/test/setup-env.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.test.json",
      },
    ],
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/app/server.ts",
  ],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 70,
      functions: 94,
      lines: 90,
    },
  },
};
