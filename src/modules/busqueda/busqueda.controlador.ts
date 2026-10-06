import { asyncHandler } from "../../utils/asyncHandler";
import * as servicio from "./busqueda.servicio";
import type { ParametrosBusqueda } from "./busqueda.esquemas";

export const buscar = asyncHandler(async (req, res) => {
  res.json(await servicio.buscar(req.query as unknown as ParametrosBusqueda));
});
