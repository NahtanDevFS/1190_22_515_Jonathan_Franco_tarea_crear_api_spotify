import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { logger } from "../config/logger";

export const noEncontrado: RequestHandler = (req, _res, next) => {
  next(
    new AppError(
      404,
      "NO_ENCONTRADO",
      `Ruta ${req.method} ${req.originalUrl} no existe`,
    ),
  );
};

function responder(
  res: Parameters<ErrorRequestHandler>[2],
  status: number,
  codigo: string,
  mensaje: string,
  detalles?: unknown,
) {
  res.status(status).json({ error: { codigo, mensaje, detalles } });
}

export const manejadorErrores: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next,
) => {
  if (err instanceof ZodError) {
    return responder(
      res,
      400,
      "VALIDACION_FALLIDA",
      "Datos inválidos",
      err.flatten().fieldErrors,
    );
  }
  if (err instanceof AppError) {
    return responder(res, err.status, err.codigo, err.message, err.detalles);
  }
  // Errores de express.json(): cuerpo mal formado o demasiado grande
  const tipo = (err as { type?: string }).type;
  if (tipo === "entity.parse.failed")
    return responder(
      res,
      400,
      "JSON_INVALIDO",
      "El cuerpo de la petición no es un JSON válido",
    );
  if (tipo === "entity.too.large")
    return responder(
      res,
      413,
      "CUERPO_DEMASIADO_GRANDE",
      "El cuerpo de la petición excede el tamaño permitido",
    );

  logger.error({ err }, "Error no controlado");
  return responder(res, 500, "ERROR_INTERNO", "Error interno del servidor");
};
