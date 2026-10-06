import { asyncHandler } from "../../utils/asyncHandler";
import { usuarioActual } from "../../middlewares/autenticacion";
import * as usuariosServicio from "./usuarios.servicio";

export const perfil = asyncHandler(async (req, res) => {
  res.json(await usuariosServicio.obtenerPerfil(usuarioActual(req).id));
});
