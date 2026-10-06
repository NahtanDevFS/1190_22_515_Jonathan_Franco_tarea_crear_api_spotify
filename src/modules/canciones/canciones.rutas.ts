import { Router } from "express";
import { autenticar, requerirRol } from "../../middlewares/autenticacion";
import { validar } from "../../middlewares/validate";
import { esquemaId } from "../../utils/paginacion";
import * as controlador from "./canciones.controlador";
import {
  esquemaActualizarCancion,
  esquemaCrearCancion,
  esquemaListarCanciones,
} from "./canciones.esquemas";

export const cancionesRutas = Router();

cancionesRutas.use(autenticar);

cancionesRutas.get(
  "/",
  validar({ query: esquemaListarCanciones }),
  controlador.listar,
);
cancionesRutas.get("/:id", validar({ params: esquemaId }), controlador.obtener);
cancionesRutas.post(
  "/",
  requerirRol("ADMIN"),
  validar({ body: esquemaCrearCancion }),
  controlador.crear,
);
cancionesRutas.patch(
  "/:id",
  requerirRol("ADMIN"),
  validar({ params: esquemaId, body: esquemaActualizarCancion }),
  controlador.actualizar,
);
cancionesRutas.delete(
  "/:id",
  requerirRol("ADMIN"),
  validar({ params: esquemaId }),
  controlador.eliminar,
);
