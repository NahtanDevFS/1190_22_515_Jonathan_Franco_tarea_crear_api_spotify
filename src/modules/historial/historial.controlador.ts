import { asyncHandler } from "../../utils/asyncHandler";
import type { Paginacion } from "../../utils/paginacion";
import { usuarioActual } from "../../middlewares/autenticacion";
import * as servicio from "./historial.servicio";

export const registrar = asyncHandler(async (req, res) => {
  res
    .status(201)
    .json(
      await servicio.registrar(usuarioActual(req).id, req.body.cancionId),
    );
});

export const listar = asyncHandler(async (req, res) => {
  res.json(
    await servicio.listar(
      usuarioActual(req).id,
      req.query as unknown as Paginacion,
    ),
  );
});

export const limpiar = asyncHandler(async (req, res) => {
  await servicio.limpiar(usuarioActual(req).id);
  res.status(204).send();
});
