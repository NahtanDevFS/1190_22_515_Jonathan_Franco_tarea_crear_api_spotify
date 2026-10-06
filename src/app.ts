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
import { artistasRutas } from "./modules/artistas/artistas.rutas";
import { albumesRutas } from "./modules/albumes/albumes.rutas";
import { cancionesRutas } from "./modules/canciones/canciones.rutas";
import { busquedaRutas } from "./modules/busqueda/busqueda.rutas";
import { listasRutas } from "./modules/listas/listas.rutas";
import { favoritosRutas } from "./modules/favoritos/favoritos.rutas";
import { historialRutas } from "./modules/historial/historial.rutas";
import { montarDocumentacion } from "./docs/swagger";

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

montarDocumentacion(app);

app.use("/api/v1", limitadorGeneral);
app.use("/api/v1/auth", authRutas);
app.use("/api/v1/usuarios", usuariosRutas);
app.use("/api/v1/artistas", artistasRutas);
app.use("/api/v1/albumes", albumesRutas);
app.use("/api/v1/canciones", cancionesRutas);
app.use("/api/v1/buscar", busquedaRutas);
app.use("/api/v1/listas", listasRutas);
app.use("/api/v1/favoritos", favoritosRutas);
app.use("/api/v1/historial", historialRutas);

app.use(noEncontrado);
app.use(manejadorErrores);
