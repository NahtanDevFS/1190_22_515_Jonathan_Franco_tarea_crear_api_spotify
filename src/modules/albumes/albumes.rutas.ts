import { Router } from "express";
import { autenticar, requerirRol } from "../../middlewares/autenticacion";
import { validar } from "../../middlewares/validate";
import { esquemaId } from "../../utils/paginacion";
import * as controlador from "./albumes.controlador";
import {
  esquemaActualizarAlbum,
  esquemaCrearAlbum,
  esquemaListarAlbumes,
} from "./albumes.esquemas";

export const albumesRutas = Router();

albumesRutas.use(autenticar);

albumesRutas.get(
  "/",
  validar({ query: esquemaListarAlbumes }),
  controlador.listar,
);
albumesRutas.get("/:id", validar({ params: esquemaId }), controlador.obtener);
albumesRutas.post(
  "/",
  requerirRol("ADMIN"),
  validar({ body: esquemaCrearAlbum }),
  controlador.crear,
);
albumesRutas.patch(
  "/:id",
  requerirRol("ADMIN"),
  validar({ params: esquemaId, body: esquemaActualizarAlbum }),
  controlador.actualizar,
);
albumesRutas.delete(
  "/:id",
  requerirRol("ADMIN"),
  validar({ params: esquemaId }),
  controlador.eliminar,
);
