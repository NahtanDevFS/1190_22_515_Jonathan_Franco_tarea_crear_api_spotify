import { Router } from "express";
import { autenticar } from "../../middlewares/autenticacion";
import { validar } from "../../middlewares/validate";
import * as controlador from "./busqueda.controlador";
import { esquemaBusqueda } from "./busqueda.esquemas";

export const busquedaRutas = Router();

busquedaRutas.get(
  "/",
  autenticar,
  validar({ query: esquemaBusqueda }),
  controlador.buscar,
);
