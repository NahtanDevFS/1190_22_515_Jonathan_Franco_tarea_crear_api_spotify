import express from "express";
import helmet from "helmet";
import cors from "cors";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { notFound, errorHandler } from "./middlewares/errorHandler";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN.split(",") }));
app.use(express.json({ limit: "100kb" }));
app.use(
  pinoHttp({
    logger,
    serializers: {
      req: (req) => ({ id: req.id, method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  }),
);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Los módulos se montan aquí en las siguientes fases:
// app.use('/api/v1/auth', authRouter);

app.use(notFound);
app.use(errorHandler);
