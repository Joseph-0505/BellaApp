export type ServiceLogger = {
  debug(payload: object, message?: string): void;
  error(payload: object, message?: string): void;
  info(payload: object, message?: string): void;
  warn(payload: object, message?: string): void;
};
