import { buildApp } from "./app";
import { env } from "../config/env";

type ShutdownSignal = "SIGINT" | "SIGTERM";

const app = buildApp();
const listenOptions = {
  host: env.HOST,
  port: env.PORT,
};
const shutdownSignals: ShutdownSignal[] = ["SIGINT", "SIGTERM"];

// Evita disparar o encerramento mais de uma vez se chegarem sinais repetidos.
let isShuttingDown = false;

// Sobe o servidor HTTP com as configurações definidas no ambiente.
// Se algo falhar aqui, o processo é encerrado para não deixar a aplicação em estado inconsistente.
async function startServer(): Promise<void> {
  try {
    await app.listen(listenOptions);
  } catch (error) {
    app.log.error({ error }, "Failed to start server");
    process.exit(1);
  }
}

// Fecha o servidor de forma controlada quando o processo recebe um sinal do sistema.
async function shutdownServer(signal: ShutdownSignal): Promise<void> {
  if (isShuttingDown) {
    app.log.warn({ signal }, "Shutdown already in progress");
    return;
  }

  isShuttingDown = true;
  app.log.info({ signal }, "Shutting down application");

  try {
    await app.close();
  } catch (error) {
    app.log.error({ error, signal }, "Failed to shut down application cleanly");
    process.exit(1);
  }
}

// Registra os sinais do sistema operacional que devem iniciar o shutdown gracioso.
function registerShutdownHandlers(): void {
  for (const signal of shutdownSignals) {
    process.once(signal, () => {
      void shutdownServer(signal);
    });
  }
}

registerShutdownHandlers();

void startServer();
