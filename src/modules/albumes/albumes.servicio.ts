import { AppError } from "../../utils/AppError";
import { paginar, saltar } from "../../utils/paginacion";
import { artistasRepositorio } from "../artistas/artistas.repositorio";
import { albumesRepositorio } from "./albumes.repositorio";
import type {
  DatosActualizarAlbum,
  DatosAlbum,
  FiltrosAlbumes,
} from "./albumes.esquemas";

export async function listar(filtros: FiltrosAlbumes) {
  const [datos, total] = await albumesRepositorio.listar({
    q: filtros.q,
    artistaId: filtros.artistaId,
    skip: saltar(filtros),
    take: filtros.limite,
  });
  return paginar(datos, total, filtros);
}

export async function obtener(id: string) {
  const album = await albumesRepositorio.buscarPorId(id);
  if (!album)
    throw new AppError(404, "ALBUM_NO_ENCONTRADO", "Álbum no encontrado");
  return album;
}

export async function crear(datos: DatosAlbum) {
  if (!(await artistasRepositorio.buscarPorId(datos.artistaId)))
    throw new AppError(404, "ARTISTA_NO_ENCONTRADO", "Artista no encontrado");
  return albumesRepositorio.crear(datos);
}

export async function actualizar(id: string, datos: DatosActualizarAlbum) {
  await obtener(id);
  return albumesRepositorio.actualizar(id, datos);
}

export async function eliminar(id: string) {
  await obtener(id);
  await albumesRepositorio.eliminar(id);
}
