import pino from "pino";
import { env } from "./env";

export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : "info",
  redact: [
    "req.headers.authorization",
    "req.body.password",
    "req.body.refreshToken",
  ],
  transport:
    env.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
});
