import { Router } from "express";
import { autenticar, requerirRol } from "../../middlewares/autenticacion";
import { validar } from "../../middlewares/validate";
import { esquemaId } from "../../utils/paginacion";
import * as controlador from "./artistas.controlador";
import {
  esquemaActualizarArtista,
  esquemaCrearArtista,
  esquemaListarArtistas,
} from "./artistas.esquemas";

export const artistasRutas = Router();

// Lectura: cualquier usuario autenticado. Escritura: solo ADMIN.
artistasRutas.use(autenticar);

artistasRutas.get(
  "/",
  validar({ query: esquemaListarArtistas }),
  controlador.listar,
);
artistasRutas.get("/:id", validar({ params: esquemaId }), controlador.obtener);
artistasRutas.post(
  "/",
  requerirRol("ADMIN"),
  validar({ body: esquemaCrearArtista }),
  controlador.crear,
);
artistasRutas.patch(
  "/:id",
  requerirRol("ADMIN"),
  validar({ params: esquemaId, body: esquemaActualizarArtista }),
  controlador.actualizar,
);
artistasRutas.delete(
  "/:id",
  requerirRol("ADMIN"),
  validar({ params: esquemaId }),
  controlador.eliminar,
);
