const base = require("./jest.config.cjs");

// Unit checks must not run the database-reset setup used by integration tests.
module.exports = {
  ...base,
  globalSetup: undefined,
  testMatch: ["**/modules/**/*.spec.ts", "**/shared/**/*.spec.ts"],
};
