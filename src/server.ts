import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";

const server = app.listen(env.PORT, () => {
  logger.info(`API escuchando en http://localhost:${env.PORT}`);
});

function shutdown(signal: string) {
  logger.info(`${signal} recibido, cerrando...`);
  server.close(() => process.exit(0));
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
