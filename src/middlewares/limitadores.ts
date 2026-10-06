import rateLimit, { type Options } from "express-rate-limit";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

export function crearLimitador(opciones: Partial<Options> = {}) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: () => env.NODE_ENV === "test",
    handler: (_req, _res, next) => {
      next(
        new AppError(
          429,
          "DEMASIADAS_PETICIONES",
          "Demasiadas peticiones, intenta de nuevo más tarde",
        ),
      );
    },
    ...opciones,
  });
}

// General: 100 peticiones por minuto por IP
export const limitadorGeneral = crearLimitador({
  windowMs: 60 * 1000,
  limit: 100,
});

// Estricto para registro e inicio de sesión: 10 intentos cada 15 minutos por IP
export const limitadorAuth = crearLimitador({
  windowMs: 15 * 60 * 1000,
  limit: 10,
});
