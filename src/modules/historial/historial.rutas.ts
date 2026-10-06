import { Router } from "express";
import { z } from "zod";
import { autenticar } from "../../middlewares/autenticacion";
import { validar } from "../../middlewares/validate";
import { esquemaPaginacion } from "../../utils/paginacion";
import * as controlador from "./historial.controlador";

export const historialRutas = Router();

const esquemaRegistrar = z.object({ cancionId: z.string().uuid() }).strict();

historialRutas.use(autenticar);

historialRutas.post(
  "/",
  validar({ body: esquemaRegistrar }),
  controlador.registrar,
);
historialRutas.get(
  "/",
  validar({ query: esquemaPaginacion }),
  controlador.listar,
);
historialRutas.delete("/", controlador.limpiar);
