import { prisma } from "../../config/prisma";
import { incluirCancion } from "../canciones/canciones.repositorio";
import type { DatosActualizarLista } from "./listas.esquemas";

const incluirCanciones = {
  canciones: {
    orderBy: { posicion: "asc" },
    include: { cancion: { include: incluirCancion } },
  },
} as const;

export const listasRepositorio = {
  crear: (datos: {
    nombre: string;
    esPublica: boolean;
    propietarioId: string;
  }) => prisma.listaReproduccion.create({ data: datos }),

  listarDeUsuario: (propietarioId: string, skip: number, take: number) =>
    prisma.$transaction([
      prisma.listaReproduccion.findMany({
        where: { propietarioId },
        orderBy: { creadoEn: "desc" },
        skip,
        take,
      }),
      prisma.listaReproduccion.count({ where: { propietarioId } }),
    ]),

  buscarPorId: (id: string) =>
    prisma.listaReproduccion.findUnique({
      where: { id },
      include: incluirCanciones,
    }),

  actualizar: (id: string, datos: DatosActualizarLista) =>
    prisma.listaReproduccion.update({ where: { id }, data: datos }),

  eliminar: (id: string) => prisma.listaReproduccion.delete({ where: { id } }),

  // La posición se calcula dentro de la transacción: siempre queda al final.
  // Devuelve false si la canción ya estaba en la lista.
  agregarCancion: (listaId: string, cancionId: string) =>
    prisma.$transaction(async (tx) => {
      const existente = await tx.listaCancion.findUnique({
        where: { listaId_cancionId: { listaId, cancionId } },
      });
      if (existente) return false;
      const ultima = await tx.listaCancion.aggregate({
        where: { listaId },
        _max: { posicion: true },
      });
      await tx.listaCancion.create({
        data: { listaId, cancionId, posicion: (ultima._max.posicion ?? 0) + 1 },
      });
      return true;
    }),

  quitarCancion: (listaId: string, cancionId: string) =>
    prisma.listaCancion.deleteMany({ where: { listaId, cancionId } }),
};
