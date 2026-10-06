import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import type {
  DatosActualizarArtista,
  DatosArtista,
} from "./artistas.esquemas";

export const artistasRepositorio = {
  listar: (filtro: { q?: string; skip: number; take: number }) => {
    const where: Prisma.ArtistaWhereInput = filtro.q
      ? { nombre: { contains: filtro.q, mode: "insensitive" } }
      : {};
    return prisma.$transaction([
      prisma.artista.findMany({
        where,
        orderBy: { nombre: "asc" },
        skip: filtro.skip,
        take: filtro.take,
      }),
      prisma.artista.count({ where }),
    ]);
  },

  buscarPorId: (id: string) => prisma.artista.findUnique({ where: { id } }),

  crear: (datos: DatosArtista) => prisma.artista.create({ data: datos }),

  actualizar: (id: string, datos: DatosActualizarArtista) =>
    prisma.artista.update({ where: { id }, data: datos }),

  eliminar: (id: string) => prisma.artista.delete({ where: { id } }),
};
