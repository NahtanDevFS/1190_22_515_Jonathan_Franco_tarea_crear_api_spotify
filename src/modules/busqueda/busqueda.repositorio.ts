import { prisma } from "../../config/prisma";
import { incluirArtista } from "../albumes/albumes.repositorio";
import { incluirCancion } from "../canciones/canciones.repositorio";

export const busquedaRepositorio = {
  buscar: (q: string, take: number) => {
    const contiene = { contains: q, mode: "insensitive" as const };
    return prisma.$transaction([
      prisma.artista.findMany({
        where: { nombre: contiene },
        orderBy: { nombre: "asc" },
        take,
      }),
      prisma.album.findMany({
        where: {
          OR: [{ titulo: contiene }, { artista: { nombre: contiene } }],
        },
        include: incluirArtista,
        orderBy: { titulo: "asc" },
        take,
      }),
      prisma.cancion.findMany({
        where: {
          OR: [{ titulo: contiene }, { artista: { nombre: contiene } }],
        },
        include: incluirCancion,
        orderBy: { titulo: "asc" },
        take,
      }),
    ]);
  },
};
