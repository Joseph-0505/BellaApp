import { config } from "dotenv";
import path from "node:path";
import { z } from "zod";

config();

const booleanLikeSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (value === true || value === "true" || value === "1") {
    return true;
  }

  if (value === false || value === "false" || value === "0") {
    return false;
  }

  return value;
}, z.boolean().optional());

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    HOST: z.string().trim().default("0.0.0.0"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL e obrigatorio."),
    REDIS_URL: z.string().trim().url().default("redis://localhost:6379"),
    REDIS_ENABLED: booleanLikeSchema.default(process.env.NODE_ENV !== "test"),
    CACHE_DEFAULT_TTL_SECONDS: z.coerce.number().int().min(1).max(3600).default(60),
    CACHE_APPOINTMENTS_TTL_SECONDS: z.coerce.number().int().min(1).max(300).default(20),
    PUBSUB_ENABLED: booleanLikeSchema.default(process.env.NODE_ENV !== "test"),
    PUBSUB_CHANNEL: z.string().trim().min(1).default("bellaapp:domain-events"),
    JWT_SECRET: z.string().min(16, "JWT_SECRET precisa ter ao menos 16 caracteres."),
    JWT_EXPIRES_IN: z.string().min(1).default("1d"),
    REFRESH_TOKEN_EXPIRES_IN: z.string().min(1).default("7d"),
    CORS_ORIGIN: z.string().trim().default("http://localhost:5173"),
    UPLOAD_DIR: z.string().trim().min(1).default("uploads"),
    APP_BASE_URL: z.string().trim().url().optional(),
    INVITE_TOKEN_EXPIRES_HOURS: z.coerce.number().int().min(1).max(168).default(24),
    NOTIFICATION_SERVICE_URL: z.string().trim().url().default("http://localhost:3001"),
  });

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(
    `Variaveis de ambiente invalidas: ${parsedEnv.error.issues
      .map((issue) => issue.path.join(".") + ": " + issue.message)
      .join(", ")}`,
  );
}

const resolvedAppBaseUrl =
  parsedEnv.data.APP_BASE_URL
  || (parsedEnv.data.CORS_ORIGIN !== "*"
    ? parsedEnv.data.CORS_ORIGIN.split(",").map((origin) => origin.trim()).find(Boolean)
    : undefined)
  || "http://localhost:5173";

export const env = {
  ...parsedEnv.data,
  APP_BASE_URL: resolvedAppBaseUrl.replace(/\/+$/, ""),
  UPLOAD_DIR: path.resolve(parsedEnv.data.UPLOAD_DIR),
};
