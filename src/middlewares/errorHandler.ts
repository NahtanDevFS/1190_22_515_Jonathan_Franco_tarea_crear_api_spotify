import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { logger } from "../config/logger";

export const notFound: RequestHandler = (req, _res, next) => {
  next(
    new AppError(
      404,
      "NOT_FOUND",
      `Ruta ${req.method} ${req.originalUrl} no existe`,
    ),
  );
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Datos inválidos",
        details: err.flatten().fieldErrors,
      },
    });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }
  logger.error({ err }, "Error no controlado");
  res
    .status(500)
    .json({
      error: { code: "INTERNAL_ERROR", message: "Error interno del servidor" },
    });
};
