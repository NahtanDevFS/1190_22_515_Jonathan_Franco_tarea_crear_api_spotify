import { Router } from "express";
import { validar } from "../../middlewares/validate";
import { autenticar } from "../../middlewares/autenticacion";
import { limitadorAuth } from "../../middlewares/limitadores";
import * as controlador from "./auth.controlador";
import {
  esquemaInicioSesion,
  esquemaRegistro,
  esquemaTokenRefresco,
} from "./auth.esquemas";

export const authRutas = Router();

authRutas.post(
  "/registro",
  limitadorAuth,
  validar({ body: esquemaRegistro }),
  controlador.registro,
);
authRutas.post(
  "/iniciar-sesion",
  limitadorAuth,
  validar({ body: esquemaInicioSesion }),
  controlador.iniciarSesion,
);
authRutas.post(
  "/refrescar",
  validar({ body: esquemaTokenRefresco }),
  controlador.refrescar,
);
authRutas.post(
  "/cerrar-sesion",
  autenticar,
  validar({ body: esquemaTokenRefresco }),
  controlador.cerrarSesion,
);
