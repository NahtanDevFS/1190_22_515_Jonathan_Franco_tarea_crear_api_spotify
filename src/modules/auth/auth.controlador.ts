import { asyncHandler } from "../../utils/asyncHandler";
import { usuarioActual } from "../../middlewares/autenticacion";
import * as authServicio from "./auth.servicio";

export const registro = asyncHandler(async (req, res) => {
  res.status(201).json(await authServicio.registrar(req.body));
});

export const iniciarSesion = asyncHandler(async (req, res) => {
  res.json(await authServicio.iniciarSesion(req.body));
});

export const refrescar = asyncHandler(async (req, res) => {
  res.json(await authServicio.refrescar(req.body.tokenRefresco));
});

export const cerrarSesion = asyncHandler(async (req, res) => {
  await authServicio.cerrarSesion(
    usuarioActual(req).id,
    req.body.tokenRefresco,
  );
  res.status(204).send();
});
