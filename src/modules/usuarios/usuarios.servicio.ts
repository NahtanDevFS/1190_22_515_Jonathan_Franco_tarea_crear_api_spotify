import type { Rol, Usuario } from "@prisma/client";
import { AppError } from "../../utils/AppError";
import { usuariosRepositorio } from "./usuarios.repositorio";

export interface UsuarioPublico {
  id: string;
  correo: string;
  nombreUsuario: string;
  rol: Rol;
  creadoEn: Date;
}

// Nunca se expone contrasenaHash hacia fuera
export function aUsuarioPublico(u: Usuario): UsuarioPublico {
  return {
    id: u.id,
    correo: u.correo,
    nombreUsuario: u.nombreUsuario,
    rol: u.rol,
    creadoEn: u.creadoEn,
  };
}

export async function obtenerPerfil(
  usuarioId: string,
): Promise<UsuarioPublico> {
  const usuario = await usuariosRepositorio.buscarPorId(usuarioId);
  if (!usuario)
    throw new AppError(404, "USUARIO_NO_ENCONTRADO", "Usuario no encontrado");
  return aUsuarioPublico(usuario);
}
