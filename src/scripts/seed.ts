import bcrypt from "bcrypt";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { prisma } from "../config/prisma";
import { esquemaRegistro } from "../modules/auth/auth.esquemas";

// Crea (o promueve) el usuario administrador a partir de ADMIN_* en .env.
// Es idempotente: no cambia la contraseña de un usuario que ya existe.
async function sembrarAdmin() {
  if (!env.ADMIN_CORREO || !env.ADMIN_CONTRASENA) {
    throw new Error("Define ADMIN_CORREO y ADMIN_CONTRASENA en el .env");
  }
  // Mismas reglas que el registro correo válido y contraseña robusta
  const datos = esquemaRegistro.parse({
    correo: env.ADMIN_CORREO,
    nombreUsuario: env.ADMIN_NOMBRE_USUARIO,
    contrasena: env.ADMIN_CONTRASENA,
  });

  const existente = await prisma.usuario.findUnique({
    where: { correo: datos.correo },
  });
  if (existente) {
    if (existente.rol !== "ADMIN")
      await prisma.usuario.update({
        where: { id: existente.id },
        data: { rol: "ADMIN" },
      });
    logger.info(
      `Administrador ya existía (${datos.correo}); rol ADMIN asegurado`,
    );
    return;
  }
  await prisma.usuario.create({
    data: {
      correo: datos.correo,
      nombreUsuario: datos.nombreUsuario,
      contrasenaHash: await bcrypt.hash(datos.contrasena, env.BCRYPT_ROUNDS),
      rol: "ADMIN",
    },
  });
  logger.info(`Administrador creado (${datos.correo})`);
}

// Catálogo mínimo para probar la API (solo si SEED_DATOS_DEMO=true)
async function sembrarDemo() {
  if (env.NODE_ENV === "production") {
    logger.warn("SEED_DATOS_DEMO ignorado en producción");
    return;
  }
  if ((await prisma.artista.count()) > 0) {
    logger.info("El catálogo ya tiene datos; se omite el demo");
    return;
  }
  const artista = await prisma.artista.create({
    data: { nombre: "Soda Stereo", biografia: "Banda argentina de rock." },
  });
  const album = await prisma.album.create({
    data: {
      titulo: "Canción Animal",
      fechaLanzamiento: new Date("1990-08-01"),
      artistaId: artista.id,
    },
  });
  await prisma.cancion.createMany({
    data: [
      { titulo: "De música ligera", duracionSeg: 212 },
      { titulo: "Té para tres", duracionSeg: 258 },
      { titulo: "Un millón de años luz", duracionSeg: 247 },
    ].map((c) => ({ ...c, artistaId: artista.id, albumId: album.id })),
  });
  logger.info("Catálogo demo creado");
}

async function main() {
  await sembrarAdmin();
  if (env.SEED_DATOS_DEMO === "true") await sembrarDemo();
}

main()
  .catch((err) => {
    logger.error({ err }, "Falló el seed");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
