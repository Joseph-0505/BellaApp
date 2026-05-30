import { z } from "zod";
import { isValidCnpj, isValidCpf, normalizeNumericString } from "../utils/documents";

type SchemaValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | SchemaValue[]
  | { [key: string]: SchemaValue };

type PreprocessInput = Parameters<NonNullable<Parameters<typeof z.preprocess>[0]>>[0];

// Trata string vazia como ausencia de valor para facilitar formularios HTML.
const emptyStringToUndefined = (value: PreprocessInput): SchemaValue | PreprocessInput => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

// Normaliza booleanos vindos de query string, como "true" e "false".
const parseBoolean = (value: PreprocessInput): SchemaValue | PreprocessInput => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (value === true || value === "true") {
    return true;
  }

  if (value === false || value === "false") {
    return false;
  }

  return value;
};

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email e obrigatório.")
  .email("Email inválido.")
  .transform((value) => value.toLowerCase());

export const optionalEmailSchema = z.preprocess(emptyStringToUndefined, emailSchema.optional());

export const passwordSchema = z
  .string()
  .min(8, "Senha deve ter no mínimo 8 caracteres.")
  .max(72, "Senha deve ter no máximo 72 caracteres.")
  .refine(
    (value) => /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z\d]/.test(value),
    "Senha deve ter letra maiúscula, minúscula, número e símbolo.",
  );

export const cpfSchema = z
  .string()
  .trim()
  .min(1, "CPF e obrigatório.")
  .refine((value) => isValidCpf(normalizeNumericString(value)), "CPF inválido.");

export const optionalCpfSchema = z.preprocess(emptyStringToUndefined, cpfSchema.optional());

export const cnpjSchema = z
  .string()
  .trim()
  .min(1, "CNPJ e obrigatório.")
  .refine((value) => isValidCnpj(normalizeNumericString(value)), "CNPJ inválido.");

export const optionalCnpjSchema = z.preprocess(emptyStringToUndefined, cnpjSchema.optional());

export const requiredStringSchema = (fieldName: string, maxLength = 255) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} e obrigatório.`)
    .max(maxLength, `${fieldName} deve ter no máximo ${maxLength} caracteres.`);

export const optionalStringSchema = (fieldName: string, maxLength = 255) =>
  z.preprocess(emptyStringToUndefined, requiredStringSchema(fieldName, maxLength).optional());

export const uuidParamSchema = z
  .object({
    id: z.string().uuid("Identificador inválido."),
  })
  .strict();

export const paginationQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.preprocess(emptyStringToUndefined, z.string().trim().optional()),
  })
  .strict();

export const optionalBooleanQuerySchema = z.preprocess(parseBoolean, z.boolean().optional());
