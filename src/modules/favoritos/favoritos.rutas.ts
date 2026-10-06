import { Router } from "express";
import { autenticar } from "../../middlewares/autenticacion";
import { validar } from "../../middlewares/validate";
import { esquemaId, esquemaPaginacion } from "../../utils/paginacion";
import * as controlador from "./favoritos.controlador";

export const favoritosRutas = Router();

favoritosRutas.use(autenticar);

// :id es el identificador de la canción
favoritosRutas.get(
  "/",
  validar({ query: esquemaPaginacion }),
  controlador.listar,
);
favoritosRutas.put("/:id", validar({ params: esquemaId }), controlador.agregar);
favoritosRutas.delete(
  "/:id",
  validar({ params: esquemaId }),
  controlador.quitar,
);
