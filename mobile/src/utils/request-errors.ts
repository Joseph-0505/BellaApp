export function formatRequestError(
  requestError: unknown,
  fallbackMessage: string,
) {
  if (!requestError || typeof requestError !== "object") {
    return fallbackMessage;
  }

  const maybeMessage =
    "message" in requestError && typeof requestError.message === "string"
      ? requestError.message
      : fallbackMessage;
  const maybeStatus =
    "status" in requestError && typeof requestError.status === "number"
      ? requestError.status
      : null;
  const maybeCode =
    "code" in requestError && typeof requestError.code === "string"
      ? requestError.code
      : "";

  if ((maybeStatus && maybeStatus > 0) || maybeCode) {
    return `${maybeMessage} ${maybeStatus ? `[${maybeStatus}]` : ""}${
      maybeCode ? ` (${maybeCode})` : ""
    }`.trim();
  }

  return maybeMessage;
}
