import { config } from "dotenv";
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
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    HOST: z.string().trim().default("0.0.0.0"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL e obrigatorio."),
    JWT_SECRET: z.string().min(16, "JWT_SECRET precisa ter ao menos 16 caracteres."),
    JWT_EXPIRES_IN: z.string().min(1).default("1d"),
    REFRESH_TOKEN_EXPIRES_IN: z.string().min(1).default("7d"),
    CORS_ORIGIN: z.string().trim().default("http://localhost:5173"),
    APP_BASE_URL: z.string().trim().url().optional(),
    INVITE_TOKEN_EXPIRES_HOURS: z.coerce.number().int().min(1).max(168).default(24),
    MAIL_DELIVERY_MODE: z.enum(["log", "smtp"]).default(process.env.SMTP_HOST ? "smtp" : "log"),
    SMTP_HOST: z.string().trim().optional(),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
    SMTP_SECURE: booleanLikeSchema.default(false),
    SMTP_USER: z.string().trim().optional(),
    SMTP_PASS: z.string().trim().optional(),
    MAIL_FROM_EMAIL: z.string().trim().email().optional(),
    MAIL_FROM_NAME: z.string().trim().default("BellaApp"),
  })
  .superRefine((data, ctx) => {
    if (data.MAIL_DELIVERY_MODE !== "smtp") {
      return;
    }

    if (!data.SMTP_HOST) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SMTP_HOST"],
        message: "SMTP_HOST e obrigatorio quando MAIL_DELIVERY_MODE=smtp.",
      });
    }

    if (!data.SMTP_PORT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SMTP_PORT"],
        message: "SMTP_PORT e obrigatorio quando MAIL_DELIVERY_MODE=smtp.",
      });
    }

    if (!data.MAIL_FROM_EMAIL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["MAIL_FROM_EMAIL"],
        message: "MAIL_FROM_EMAIL e obrigatorio quando MAIL_DELIVERY_MODE=smtp.",
      });
    }
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
};
