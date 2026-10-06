import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import type { Usuario } from "@prisma/client";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import { usuariosRepositorio } from "../usuarios/usuarios.repositorio";
import {
  aUsuarioPublico,
  type UsuarioPublico,
} from "../usuarios/usuarios.servicio";
import { authRepositorio } from "./auth.repositorio";
import type { DatosInicioSesion, DatosRegistro } from "./auth.esquemas";
import {
  firmarTokenAcceso,
  firmarTokenRefresco,
  hashearToken,
  verificarTokenRefresco,
} from "./tokens";

export interface Tokens {
  tokenAcceso: string;
  tokenRefresco: string;
}
export interface Sesion extends Tokens {
  usuario: UsuarioPublico;
}

// Hash de relleno: se compara contra él cuando el correo no existe, para que el
// tiempo de respuesta sea parecido y no se pueda descubrir qué correos están registrados.
const hashRelleno = bcrypt.hash(randomUUID(), env.BCRYPT_ROUNDS);

const esViolacionUnica = (err: unknown) =>
  (err as { code?: string })?.code === "P2002";

async function emitirTokens(usuario: Usuario): Promise<Tokens> {
  const refresco = firmarTokenRefresco(usuario.id);
  await authRepositorio.crearTokenRefresco({
    hashToken: hashearToken(refresco.token),
    usuarioId: usuario.id,
    expiraEn: refresco.expiraEn,
  });
  return {
    tokenAcceso: firmarTokenAcceso(usuario),
    tokenRefresco: refresco.token,
  };
}

export async function registrar(datos: DatosRegistro): Promise<Sesion> {
  const contrasenaHash = await bcrypt.hash(datos.contrasena, env.BCRYPT_ROUNDS);
  let usuario: Usuario;
  try {
    usuario = await usuariosRepositorio.crear({
      correo: datos.correo,
      nombreUsuario: datos.nombreUsuario,
      contrasenaHash,
    });
  } catch (err) {
    if (esViolacionUnica(err)) {
      throw new AppError(
        409,
        "USUARIO_EXISTENTE",
        "El correo o el nombre de usuario ya están registrados",
      );
    }
    throw err;
  }
  return {
    usuario: aUsuarioPublico(usuario),
    ...(await emitirTokens(usuario)),
  };
}

export async function iniciarSesion(datos: DatosInicioSesion): Promise<Sesion> {
  const usuario = await usuariosRepositorio.buscarPorCorreo(datos.correo);
  const coincide = await bcrypt.compare(
    datos.contrasena,
    usuario?.contrasenaHash ?? (await hashRelleno),
  );
  // Mismo error si falla el correo o la contraseña: evita enumerar usuarios
  if (!usuario || !coincide)
    throw new AppError(401, "CREDENCIALES_INVALIDAS", "Credenciales inválidas");
  return {
    usuario: aUsuarioPublico(usuario),
    ...(await emitirTokens(usuario)),
  };
}

export async function refrescar(tokenRefresco: string): Promise<Tokens> {
  const { sub } = verificarTokenRefresco(tokenRefresco);
  const registro = await authRepositorio.buscarPorHash(
    hashearToken(tokenRefresco),
  );
  if (!registro || registro.usuarioId !== sub)
    throw new AppError(401, "TOKEN_INVALIDO", "Token inválido");

  // Un token ya rotado/revocado que vuelve a usarse indica posible robo: se cierran todas las sesiones
  if (registro.revocadoEn) {
    await authRepositorio.revocarTodosDelUsuario(registro.usuarioId);
    throw new AppError(
      401,
      "TOKEN_REUTILIZADO",
      "Sesión invalidada por seguridad. Inicia sesión de nuevo",
    );
  }
  if (registro.expiraEn <= new Date())
    throw new AppError(401, "TOKEN_EXPIRADO", "El token expiró");

  const usuario = await usuariosRepositorio.buscarPorId(registro.usuarioId);
  if (!usuario) throw new AppError(401, "TOKEN_INVALIDO", "Token inválido");

  const nuevo = firmarTokenRefresco(usuario.id);
  const rotado = await authRepositorio.rotar(registro.id, {
    hashToken: hashearToken(nuevo.token),
    usuarioId: usuario.id,
    expiraEn: nuevo.expiraEn,
  });
  if (!rotado) {
    await authRepositorio.revocarTodosDelUsuario(usuario.id);
    throw new AppError(
      401,
      "TOKEN_REUTILIZADO",
      "Sesión invalidada por seguridad. Inicia sesión de nuevo",
    );
  }
  return {
    tokenAcceso: firmarTokenAcceso(usuario),
    tokenRefresco: nuevo.token,
  };
}

// Idempotente: si el token no existe o ya fue eliminado, no pasa nada
export async function cerrarSesion(
  usuarioId: string,
  tokenRefresco: string,
): Promise<void> {
  await authRepositorio.eliminarPorHash(hashearToken(tokenRefresco), usuarioId);
}
