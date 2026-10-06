import { prisma } from "../../config/prisma";
import { incluirCancion } from "../canciones/canciones.repositorio";

export const favoritosRepositorio = {
  listar: (usuarioId: string, skip: number, take: number) =>
    prisma.$transaction([
      prisma.favorito.findMany({
        where: { usuarioId },
        include: { cancion: { include: incluirCancion } },
        orderBy: { cancion: { titulo: "asc" } },
        skip,
        take,
      }),
      prisma.favorito.count({ where: { usuarioId } }),
    ]),

  // Idempotente: marcar dos veces como favorita no falla
  agregar: (usuarioId: string, cancionId: string) =>
    prisma.favorito.upsert({
      where: { usuarioId_cancionId: { usuarioId, cancionId } },
      create: { usuarioId, cancionId },
      update: {},
    }),

  quitar: (usuarioId: string, cancionId: string) =>
    prisma.favorito.deleteMany({ where: { usuarioId, cancionId } }),
};
