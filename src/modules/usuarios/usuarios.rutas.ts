import { Router } from "express";
import { autenticar } from "../../middlewares/autenticacion";
import * as controlador from "./usuarios.controlador";

export const usuariosRutas = Router();

usuariosRutas.get("/yo", autenticar, controlador.perfil);
