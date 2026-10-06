import { asyncHandler } from "../../utils/asyncHandler";
import * as servicio from "./albumes.servicio";
import type { FiltrosAlbumes } from "./albumes.esquemas";

export const listar = asyncHandler(async (req, res) => {
  res.json(await servicio.listar(req.query as unknown as FiltrosAlbumes));
});

export const obtener = asyncHandler(async (req, res) => {
  res.json(await servicio.obtener(req.params.id));
});

export const crear = asyncHandler(async (req, res) => {
  res.status(201).json(await servicio.crear(req.body));
});

export const actualizar = asyncHandler(async (req, res) => {
  res.json(await servicio.actualizar(req.params.id, req.body));
});

export const eliminar = asyncHandler(async (req, res) => {
  await servicio.eliminar(req.params.id);
  res.status(204).send();
});
