import { asyncHandler } from "../../utils/asyncHandler";
import type { Paginacion } from "../../utils/paginacion";
import { usuarioActual } from "../../middlewares/autenticacion";
import * as servicio from "./listas.servicio";

export const crear = asyncHandler(async (req, res) => {
  res.status(201).json(await servicio.crear(usuarioActual(req).id, req.body));
});

export const listar = asyncHandler(async (req, res) => {
  res.json(
    await servicio.listarPropias(
      usuarioActual(req).id,
      req.query as unknown as Paginacion,
    ),
  );
});

export const obtener = asyncHandler(async (req, res) => {
  res.json(await servicio.obtener(req.params.id, usuarioActual(req).id));
});

export const actualizar = asyncHandler(async (req, res) => {
  res.json(
    await servicio.actualizar(req.params.id, usuarioActual(req).id, req.body),
  );
});

export const eliminar = asyncHandler(async (req, res) => {
  await servicio.eliminar(req.params.id, usuarioActual(req).id);
  res.status(204).send();
});

export const agregarCancion = asyncHandler(async (req, res) => {
  res
    .status(201)
    .json(
      await servicio.agregarCancion(
        req.params.id,
        usuarioActual(req).id,
        req.body.cancionId,
      ),
    );
});

export const quitarCancion = asyncHandler(async (req, res) => {
  await servicio.quitarCancion(
    req.params.id,
    usuarioActual(req).id,
    req.params.cancionId,
  );
  res.status(204).send();
});
