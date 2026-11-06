import { config as loadDotEnv } from "dotenv";
import { hostname } from "node:os";
import { z } from "zod";

loadDotEnv();

const booleanLikeSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (value === true || value === "true" || value === "1") return true;
  if (value === false || value === "false" || value === "0") return false;
  return value;
}, z.boolean().optional());

const optionalString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().min(1).optional(),
);

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
    HOST: z.string().trim().default("0.0.0.0"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    REDIS_URL: z.string().trim().url().default("redis://localhost:6379"),
    QUEUE_STREAM: z.string().trim().min(1).default("bellaapp:notifications"),
    QUEUE_GROUP: z.string().trim().min(1).default("bellaapp:notification-workers"),
    QUEUE_DEAD_LETTER_STREAM: z.string().trim().min(1).default("bellaapp:notifications:dead-letter"),
    QUEUE_CONSUMER_NAME: optionalString,
    QUEUE_BLOCK_MS: z.coerce.number().int().min(100).max(30_000).default(2_000),
    QUEUE_BATCH_SIZE: z.coerce.number().int().min(1).max(100).default(10),
    QUEUE_PENDING_IDLE_MS: z.coerce.number().int().min(1_000).max(3_600_000).default(10_000),
    NOTIFICATION_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(20).default(3),
    DOMAIN_EVENTS_ENABLED: booleanLikeSchema.default(true),
    PUBSUB_CHANNEL: z.string().trim().min(1).default("bellaapp:domain-events"),
    MAIL_DELIVERY_MODE: z.enum(["log", "smtp"]).default("log"),
    MAIL_FROM_EMAIL: z.string().trim().email().default("no-reply@bellaapp.local"),
    MAIL_FROM_NAME: z.string().trim().min(1).default("BellaApp"),
    SMTP_HOST: optionalString,
    SMTP_PORT: z.preprocess(
      (value) => (value === undefined || value === "" ? undefined : value),
      z.coerce.number().int().min(1).max(65_535).optional(),
    ),
    SMTP_SECURE: booleanLikeSchema.default(false),
    SMTP_USER: optionalString,
    SMTP_PASS: optionalString,
  })
  .superRefine((value, context) => {
    if (value.MAIL_DELIVERY_MODE !== "smtp") return;
    if (!value.SMTP_HOST) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["SMTP_HOST"], message: "obrigatorio no modo smtp" });
    }
    if (!value.SMTP_PORT) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["SMTP_PORT"], message: "obrigatorio no modo smtp" });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Variaveis de ambiente invalidas: ${parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ")}`,
  );
}

export const env = {
  ...parsed.data,
  QUEUE_CONSUMER_NAME:
    parsed.data.QUEUE_CONSUMER_NAME ?? `${hostname()}-${process.pid}`,
};
