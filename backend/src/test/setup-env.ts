import path from "node:path";
import { config } from "dotenv";

function resolveTestDatabaseUrl(baseUrl: string): string {
  const url = new URL(baseUrl);
  const databaseName = url.pathname.replace(/^\//, "");

  if (!databaseName) {
    throw new Error("DATABASE_URL invalida para testes.");
  }

  if (!databaseName.endsWith("_test")) {
    url.pathname = `/${databaseName}_test`;
  }

  return url.toString();
}

config({
  path: path.resolve(__dirname, "../../.env"),
});

process.env.NODE_ENV = "test";
process.env.PORT = process.env.PORT ?? "3001";
process.env.HOST = process.env.HOST ?? "127.0.0.1";
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST
  ?? resolveTestDatabaseUrl(process.env.DATABASE_URL ?? "mysql://root:@localhost:3306/bellaapp");
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret-with-16-chars";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "1d";
process.env.REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN ?? "7d";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";
