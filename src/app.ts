import "./config/zod";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { noEncontrado, manejadorErrores } from "./middlewares/errorHandler";
import { limitadorGeneral } from "./middlewares/limitadores";
import { authRutas } from "./modules/auth/auth.rutas";
import { usuariosRutas } from "./modules/usuarios/usuarios.rutas";

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
    estado: "ok",
    tiempoActivoSeg: Math.round(process.uptime()),
    fecha: new Date().toISOString(),
  });
});

app.use("/api/v1", limitadorGeneral);
app.use("/api/v1/auth", authRutas);
app.use("/api/v1/usuarios", usuariosRutas);

app.use(noEncontrado);
app.use(manejadorErrores);
