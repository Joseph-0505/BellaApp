import { randomUUID } from "node:crypto";
import { createReadStream, existsSync, mkdirSync } from "node:fs";
import { open, stat, unlink } from "node:fs/promises";
import path from "node:path";

import multer from "fastify-multer";

import { env } from "../../config/env";
import { AppError } from "../errors/app-error";

export const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PROFILE_IMAGE_FIELD = "photo";

const profileImageDirectory = path.join(env.UPLOAD_DIR, "profile");
const allowedTypes = new Map([
  ["image/jpeg", new Set([".jpg", ".jpeg"])],
  ["image/png", new Set([".png"])],
  ["image/webp", new Set([".webp"])],
]);
const storedFilePattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/i;

mkdirSync(profileImageDirectory, { recursive: true });

export type UploadedProfileImage = {
  filename: string;
  mimetype: string;
  originalname: string;
  path: string;
  size: number;
};

function createUniqueFileName(extension: string) {
  let fileName = `${randomUUID()}${extension}`;

  while (existsSync(path.join(profileImageDirectory, fileName))) {
    fileName = `${randomUUID()}${extension}`;
  }

  return fileName;
}

function resolveCanonicalExtension(mimetype: string) {
  if (mimetype === "image/jpeg") return ".jpg";
  if (mimetype === "image/png") return ".png";
  return ".webp";
}

const storage = multer.diskStorage({
  destination: profileImageDirectory,
  filename: (_request, file, callback) => {
    callback(null, createUniqueFileName(resolveCanonicalExtension(file.mimetype)));
  },
});

const profileImageMulter = multer({
  storage,
  limits: {
    fields: 0,
    fileSize: PROFILE_IMAGE_MAX_BYTES,
    files: 1,
    parts: 1,
  },
  fileFilter: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = allowedTypes.get(file.mimetype);

    if (!allowedExtensions?.has(extension)) {
      callback(
        new AppError(
          415,
          "UNSUPPORTED_IMAGE_TYPE",
          "Envie uma imagem JPEG, PNG ou WebP válida.",
        ),
        false,
      );
      return;
    }

    callback(null, true);
  },
});

export const receiveProfileImage = profileImageMulter.single(PROFILE_IMAGE_FIELD);

function detectImageMimeType(bytes: Buffer) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 8
    && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "image/png";
  }

  if (
    bytes.length >= 12
    && bytes.subarray(0, 4).toString("ascii") === "RIFF"
    && bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

export async function assertStoredProfileImageIsValid(file: UploadedProfileImage) {
  const handle = await open(file.path, "r");

  try {
    const bytes = Buffer.alloc(12);
    const { bytesRead } = await handle.read(bytes, 0, bytes.length, 0);
    const detectedType = detectImageMimeType(bytes.subarray(0, bytesRead));

    if (!detectedType || detectedType !== file.mimetype) {
      throw new AppError(
        415,
        "INVALID_IMAGE_CONTENT",
        "O conteúdo do arquivo não corresponde a uma imagem válida.",
      );
    }
  } finally {
    await handle.close();
  }
}

export function getProfileImageUrl(fileName: string | null | undefined) {
  return fileName ? `/api/v1/profile-images/${fileName}` : null;
}

export async function removeStoredProfileImage(fileName: string | null | undefined) {
  if (!fileName || !storedFilePattern.test(fileName)) return;

  try {
    await unlink(path.join(profileImageDirectory, fileName));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

export async function openStoredProfileImage(fileName: string) {
  if (!storedFilePattern.test(fileName)) {
    throw new AppError(404, "RESOURCE_NOT_FOUND", "Imagem não encontrada.");
  }

  const filePath = path.join(profileImageDirectory, fileName);

  try {
    const fileStats = await stat(filePath);

    if (!fileStats.isFile()) {
      throw new AppError(404, "RESOURCE_NOT_FOUND", "Imagem não encontrada.");
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new AppError(404, "RESOURCE_NOT_FOUND", "Imagem não encontrada.");
    }

    throw error;
  }

  return {
    contentType: fileName.endsWith(".png")
      ? "image/png"
      : fileName.endsWith(".webp")
        ? "image/webp"
        : "image/jpeg",
    stream: createReadStream(filePath),
  };
}
