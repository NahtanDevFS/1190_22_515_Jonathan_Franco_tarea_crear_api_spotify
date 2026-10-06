import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { createHash, randomUUID } from "node:crypto";
import type { Rol } from "@prisma/client";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";

const EMISOR = "musicapi";
const ALGORITMO = "HS256";

export interface PayloadAcceso {
  sub: string;
  rol: Rol;
}

export function firmarTokenAcceso(usuario: { id: string; rol: Rol }): string {
  return jwt.sign({ rol: usuario.rol, tipo: "acceso" }, env.JWT_ACCESS_SECRET, {
    subject: usuario.id,
    issuer: EMISOR,
    algorithm: ALGORITMO,
    expiresIn: env.JWT_ACCESS_EXPIRES as SignOptions["expiresIn"],
  });
}

export function firmarTokenRefresco(usuarioId: string): {
  token: string;
  expiraEn: Date;
} {
  const token = jwt.sign({ tipo: "refresco" }, env.JWT_REFRESH_SECRET, {
    subject: usuarioId,
    issuer: EMISOR,
    algorithm: ALGORITMO,
    expiresIn: env.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60,
    jwtid: randomUUID(), // hace único cada token (necesario para la rotación)
  });
  const { exp } = jwt.decode(token) as JwtPayload;
  return { token, expiraEn: new Date((exp as number) * 1000) };
}

function verificar(
  token: string,
  secreto: string,
  tipo: "acceso" | "refresco",
): JwtPayload & { sub: string } {
  try {
    const payload = jwt.verify(token, secreto, {
      algorithms: [ALGORITMO],
      issuer: EMISOR,
    });
    if (typeof payload === "string" || payload.tipo !== tipo || !payload.sub)
      throw new Error("payload inválido");
    return payload as JwtPayload & { sub: string };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError)
      throw new AppError(401, "TOKEN_EXPIRADO", "El token expiró");
    throw new AppError(401, "TOKEN_INVALIDO", "Token inválido");
  }
}

export function verificarTokenAcceso(token: string): PayloadAcceso {
  const payload = verificar(token, env.JWT_ACCESS_SECRET, "acceso");
  return { sub: payload.sub, rol: payload.rol as Rol };
}

export function verificarTokenRefresco(token: string): { sub: string } {
  const payload = verificar(token, env.JWT_REFRESH_SECRET, "refresco");
  return { sub: payload.sub };
}

// En la BD solo se guarda el hash del refresh token, nunca el token.
export function hashearToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
