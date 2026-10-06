import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import type { DatosActualizarAlbum, DatosAlbum } from "./albumes.esquemas";

export const incluirArtista = {
  artista: { select: { id: true, nombre: true } },
} satisfies Prisma.AlbumInclude;

export const albumesRepositorio = {
  listar: (filtro: {
    q?: string;
    artistaId?: string;
    skip: number;
    take: number;
  }) => {
    const where: Prisma.AlbumWhereInput = {
      ...(filtro.q && {
        titulo: { contains: filtro.q, mode: "insensitive" },
      }),
      ...(filtro.artistaId && { artistaId: filtro.artistaId }),
    };
    return prisma.$transaction([
      prisma.album.findMany({
        where,
        include: incluirArtista,
        orderBy: { titulo: "asc" },
        skip: filtro.skip,
        take: filtro.take,
      }),
      prisma.album.count({ where }),
    ]);
  },

  buscarPorId: (id: string) =>
    prisma.album.findUnique({ where: { id }, include: incluirArtista }),

  crear: (datos: DatosAlbum) =>
    prisma.album.create({ data: datos, include: incluirArtista }),

  actualizar: (id: string, datos: DatosActualizarAlbum) =>
    prisma.album.update({
      where: { id },
      data: datos,
      include: incluirArtista,
    }),

  eliminar: (id: string) => prisma.album.delete({ where: { id } }),
};
