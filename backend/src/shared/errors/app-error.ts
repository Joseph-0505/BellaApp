type AppErrorPrimitive = string | number | boolean | null;
type AppErrorDetails = AppErrorPrimitive | AppErrorDetails[] | { [key: string]: AppErrorDetails };

// Erro de domínio da aplicação com status HTTP, código interno e detalhes opcionais.
export class AppError extends Error {
  public readonly details: AppErrorDetails | undefined;

  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    ...[message, details]: [string, AppErrorDetails?]
  ) {
    super(message);
    this.name = "AppError";
    this.details = details;
  }
}

export type { AppErrorDetails };
