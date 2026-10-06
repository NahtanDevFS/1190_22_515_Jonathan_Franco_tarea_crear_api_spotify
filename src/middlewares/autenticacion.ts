import type { Request, RequestHandler } from "express";
import type { Rol } from "@prisma/client";
import { AppError } from "../utils/AppError";
import { verificarTokenAcceso } from "../modules/auth/tokens";
import type { UsuarioAutenticado } from "../types/express";

// Exige "Authorization: Bearer <tokenAcceso>" y deja el usuario en req.usuario
export const autenticar: RequestHandler = (req, _res, next) => {
  const cabecera = req.headers.authorization;
  if (!cabecera || !cabecera.startsWith("Bearer ")) {
    return next(
      new AppError(401, "NO_AUTENTICADO", "Se requiere un token de acceso"),
    );
  }
  try {
    const payload = verificarTokenAcceso(cabecera.slice(7).trim());
    req.usuario = { id: payload.sub, rol: payload.rol };
    next();
  } catch (err) {
    next(err);
  }
};

// Uso: router.post('/', autenticar, requerirRol('ADMIN'), controlador)
export const requerirRol =
  (...roles: Rol[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.usuario)
      return next(
        new AppError(401, "NO_AUTENTICADO", "Se requiere un token de acceso"),
      );
    if (!roles.includes(req.usuario.rol)) {
      return next(
        new AppError(
          403,
          "PROHIBIDO",
          "No tienes permisos para realizar esta acción",
        ),
      );
    }
    next();
  };

// Devuelve el usuario autenticado o lanza 401 (evita usar "!" en los controladores)
export function usuarioActual(req: Request): UsuarioAutenticado {
  if (!req.usuario)
    throw new AppError(401, "NO_AUTENTICADO", "Se requiere un token de acceso");
  return req.usuario;
}
