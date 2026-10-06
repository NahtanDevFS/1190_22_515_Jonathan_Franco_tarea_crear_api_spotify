import { prisma } from "../../config/prisma";
import { incluirCancion } from "../canciones/canciones.repositorio";

export const historialRepositorio = {
  registrar: (usuarioId: string, cancionId: string) =>
    prisma.historialReproduccion.create({ data: { usuarioId, cancionId } }),

  listar: (usuarioId: string, skip: number, take: number) =>
    prisma.$transaction([
      prisma.historialReproduccion.findMany({
        where: { usuarioId },
        include: { cancion: { include: incluirCancion } },
        orderBy: { reproducidaEn: "desc" },
        skip,
        take,
      }),
      prisma.historialReproduccion.count({ where: { usuarioId } }),
    ]),

  limpiar: (usuarioId: string) =>
    prisma.historialReproduccion.deleteMany({ where: { usuarioId } }),
};
