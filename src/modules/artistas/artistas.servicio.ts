import { AppError } from "../../utils/AppError";
import { paginar, saltar } from "../../utils/paginacion";
import { artistasRepositorio } from "./artistas.repositorio";
import type {
  DatosActualizarArtista,
  DatosArtista,
  FiltrosArtistas,
} from "./artistas.esquemas";

export async function listar(filtros: FiltrosArtistas) {
  const [datos, total] = await artistasRepositorio.listar({
    q: filtros.q,
    skip: saltar(filtros),
    take: filtros.limite,
  });
  return paginar(datos, total, filtros);
}

export async function obtener(id: string) {
  const artista = await artistasRepositorio.buscarPorId(id);
  if (!artista)
    throw new AppError(404, "ARTISTA_NO_ENCONTRADO", "Artista no encontrado");
  return artista;
}

export const crear = (datos: DatosArtista) => artistasRepositorio.crear(datos);

export async function actualizar(id: string, datos: DatosActualizarArtista) {
  await obtener(id);
  return artistasRepositorio.actualizar(id, datos);
}

export async function eliminar(id: string) {
  await obtener(id);
  await artistasRepositorio.eliminar(id);
}
