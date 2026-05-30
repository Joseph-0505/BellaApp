const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { config } = require("dotenv");
const { PrismaClient } = require("@prisma/client");

function resolveTestDatabaseUrl(baseUrl) {
  const url = new URL(baseUrl);
  const databaseName = url.pathname.replace(/^\//, "");

  if (!databaseName) {
    throw new Error("DATABASE_URL invalida para preparar os testes.");
  }

  if (!databaseName.endsWith("_test")) {
    url.pathname = `/${databaseName}_test`;
  }

  return {
    databaseName: url.pathname.replace(/^\//, ""),
    databaseUrl: url.toString(),
  };
}

module.exports = async () => {
  config({
    path: path.resolve(__dirname, ".env"),
  });

  const baseDatabaseUrl = process.env.DATABASE_URL;

  if (!baseDatabaseUrl) {
    throw new Error("DATABASE_URL nao encontrada para preparar os testes.");
  }

  const { databaseName, databaseUrl } = process.env.DATABASE_URL_TEST
    ? {
        databaseName: new URL(process.env.DATABASE_URL_TEST).pathname.replace(/^\//, ""),
        databaseUrl: process.env.DATABASE_URL_TEST,
      }
    : resolveTestDatabaseUrl(baseDatabaseUrl);

  const adminUrl = new URL(baseDatabaseUrl);
  adminUrl.pathname = "/mysql";

  const adminPrisma = new PrismaClient({
    datasources: {
      db: {
        url: adminUrl.toString(),
      },
    },
  });

  try {
    await adminPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS \`${databaseName}\``);
    await adminPrisma.$executeRawUnsafe(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
  } finally {
    await adminPrisma.$disconnect();
  }

  execFileSync(
    process.execPath,
    [require.resolve("prisma/build/index.js"), "db", "push", "--skip-generate", "--accept-data-loss"],
    {
      cwd: __dirname,
      env: {
        ...process.env,
        NODE_ENV: "test",
        DATABASE_URL: databaseUrl,
      },
      stdio: "pipe",
    },
  );
};
