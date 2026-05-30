import { PrismaClient } from "@prisma/client";

declare global {
  var __prisma__: PrismaClient | undefined;
}

// Reaproveita a mesma instancia do Prisma em desenvolvimento para evitar conexoes duplicadas em hot reload.
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definida");
}

export const prisma =
  global.__prisma__ ??
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma__ = prisma;
}
