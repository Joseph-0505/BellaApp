import { buildApp } from "./app";
import { env } from "../config/env";

type ShutdownSignal = "SIGINT" | "SIGTERM";

const app = buildApp();
const listenOptions = {
  host: env.HOST,
  port: env.PORT,
};
const shutdownSignals: ShutdownSignal[] = ["SIGINT", "SIGTERM"];

let isShuttingDown = false;

async function startServer(): Promise<void> {
  try {
    await app.listen(listenOptions);
  } catch (error) {
    app.log.error({ error }, "Failed to start server");
    process.exit(1);
  }
}

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

function registerShutdownHandlers(): void {
  for (const signal of shutdownSignals) {
    process.once(signal, () => {
      void shutdownServer(signal);
    });
  }
}

registerShutdownHandlers();

void startServer();
