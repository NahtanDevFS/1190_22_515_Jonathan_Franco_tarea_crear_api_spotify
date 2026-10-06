import { z } from "zod";

const correo = z.string().trim().toLowerCase().email().max(254);

const contrasenaNueva = z
  .string()
  .min(8)
  // bcrypt solo considera los primeros 72 bytes
  .refine((c) => Buffer.byteLength(c, "utf8") <= 72, {
    message: "Debe tener como máximo 72 bytes",
  })
  .refine((c) => /[A-Za-z]/.test(c) && /\d/.test(c), {
    message: "Debe incluir al menos una letra y un número",
  });

// .strict() rechaza campos extra: evita, por ejemplo, que alguien envíe "rol": "ADMIN" al registrarse
export const esquemaRegistro = z
  .object({
    correo,
    nombreUsuario: z
      .string()
      .trim()
      .min(3)
      .max(30)
      .regex(/^[a-zA-Z0-9_]+$/, {
        message: "Solo letras, números y guion bajo",
      }),
    contrasena: contrasenaNueva,
  })
  .strict();

export const esquemaInicioSesion = z
  .object({
    correo,
    contrasena: z.string().min(1).max(128),
  })
  .strict();

export const esquemaTokenRefresco = z
  .object({ tokenRefresco: z.string().min(1).max(2048) })
  .strict();

export type DatosRegistro = z.infer<typeof esquemaRegistro>;
export type DatosInicioSesion = z.infer<typeof esquemaInicioSesion>;
