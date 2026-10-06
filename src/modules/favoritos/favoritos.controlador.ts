import { asyncHandler } from "../../utils/asyncHandler";
import type { Paginacion } from "../../utils/paginacion";
import { usuarioActual } from "../../middlewares/autenticacion";
import * as servicio from "./favoritos.servicio";

export const listar = asyncHandler(async (req, res) => {
  res.json(
    await servicio.listar(
      usuarioActual(req).id,
      req.query as unknown as Paginacion,
    ),
  );
});

export const agregar = asyncHandler(async (req, res) => {
  res.json(await servicio.agregar(usuarioActual(req).id, req.params.id));
});

export const quitar = asyncHandler(async (req, res) => {
  await servicio.quitar(usuarioActual(req).id, req.params.id);
  res.status(204).send();
});
