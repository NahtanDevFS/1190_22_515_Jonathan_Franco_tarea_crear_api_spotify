import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import type {
  DatosActualizarCancion,
  DatosCancion,
} from "./canciones.esquemas";

// Forma estándar con la que se devuelve una canción en toda la API
export const incluirCancion = {
  artista: { select: { id: true, nombre: true } },
  album: { select: { id: true, titulo: true } },
} satisfies Prisma.CancionInclude;

export const cancionesRepositorio = {
  listar: (filtro: {
    q?: string;
    artistaId?: string;
    albumId?: string;
    skip: number;
    take: number;
  }) => {
    const where: Prisma.CancionWhereInput = {
      ...(filtro.q && {
        titulo: { contains: filtro.q, mode: "insensitive" },
      }),
      ...(filtro.artistaId && { artistaId: filtro.artistaId }),
      ...(filtro.albumId && { albumId: filtro.albumId }),
    };
    return prisma.$transaction([
      prisma.cancion.findMany({
        where,
        include: incluirCancion,
        orderBy: { titulo: "asc" },
        skip: filtro.skip,
        take: filtro.take,
      }),
      prisma.cancion.count({ where }),
    ]);
  },

  buscarPorId: (id: string) =>
    prisma.cancion.findUnique({ where: { id }, include: incluirCancion }),

  crear: (datos: DatosCancion) =>
    prisma.cancion.create({ data: datos, include: incluirCancion }),

  actualizar: (id: string, datos: DatosActualizarCancion) =>
    prisma.cancion.update({
      where: { id },
      data: datos,
      include: incluirCancion,
    }),

  eliminar: (id: string) => prisma.cancion.delete({ where: { id } }),
};
