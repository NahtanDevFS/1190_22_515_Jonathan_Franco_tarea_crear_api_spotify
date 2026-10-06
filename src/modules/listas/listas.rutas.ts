import { Router } from "express";
import { autenticar } from "../../middlewares/autenticacion";
import { validar } from "../../middlewares/validate";
import { esquemaId } from "../../utils/paginacion";
import * as controlador from "./listas.controlador";
import {
  esquemaActualizarLista,
  esquemaAgregarCancion,
  esquemaCrearLista,
  esquemaListarListas,
  esquemaParamsListaCancion,
} from "./listas.esquemas";

export const listasRutas = Router();

listasRutas.use(autenticar);

listasRutas.post("/", validar({ body: esquemaCrearLista }), controlador.crear);
listasRutas.get(
  "/",
  validar({ query: esquemaListarListas }),
  controlador.listar,
);
listasRutas.get("/:id", validar({ params: esquemaId }), controlador.obtener);
listasRutas.patch(
  "/:id",
  validar({ params: esquemaId, body: esquemaActualizarLista }),
  controlador.actualizar,
);
listasRutas.delete(
  "/:id",
  validar({ params: esquemaId }),
  controlador.eliminar,
);
listasRutas.post(
  "/:id/canciones",
  validar({ params: esquemaId, body: esquemaAgregarCancion }),
  controlador.agregarCancion,
);
listasRutas.delete(
  "/:id/canciones/:cancionId",
  validar({ params: esquemaParamsListaCancion }),
  controlador.quitarCancion,
);
