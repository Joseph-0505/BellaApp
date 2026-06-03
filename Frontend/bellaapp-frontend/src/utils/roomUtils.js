export const DEFAULT_ROOM_COLOR = "#E8D8E2";

const ROOM_COLOR_PATTERN = /^#([0-9A-F]{6})$/i;

export function normalizeRoomColor(value) {
  const trimmedValue = String(value || "").trim().toUpperCase();

  if (!trimmedValue) {
    return "";
  }

  if (!trimmedValue.startsWith("#")) {
    const prefixedValue = `#${trimmedValue}`;
    return ROOM_COLOR_PATTERN.test(prefixedValue) ? prefixedValue : "";
  }

  return ROOM_COLOR_PATTERN.test(trimmedValue) ? trimmedValue : "";
}

export function resolveRoomColor(value) {
  return normalizeRoomColor(value) || DEFAULT_ROOM_COLOR;
}

export function isValidRoomColor(value) {
  return !String(value || "").trim() || Boolean(normalizeRoomColor(value));
}
