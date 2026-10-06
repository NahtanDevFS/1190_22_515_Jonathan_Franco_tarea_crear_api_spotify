import { AppError } from "../../utils/AppError";
import { paginar, saltar } from "../../utils/paginacion";
import { artistasRepositorio } from "../artistas/artistas.repositorio";
import { albumesRepositorio } from "../albumes/albumes.repositorio";
import { cancionesRepositorio } from "./canciones.repositorio";
import type {
  DatosActualizarCancion,
  DatosCancion,
  FiltrosCanciones,
} from "./canciones.esquemas";

export async function listar(filtros: FiltrosCanciones) {
  const [datos, total] = await cancionesRepositorio.listar({
    q: filtros.q,
    artistaId: filtros.artistaId,
    albumId: filtros.albumId,
    skip: saltar(filtros),
    take: filtros.limite,
  });
  return paginar(datos, total, filtros);
}

export async function obtener(id: string) {
  const cancion = await cancionesRepositorio.buscarPorId(id);
  if (!cancion)
    throw new AppError(404, "CANCION_NO_ENCONTRADA", "Canción no encontrada");
  return cancion;
}

// El álbum debe existir y pertenecer al mismo artista que la canción
async function validarAlbum(albumId: string, artistaId: string) {
  const album = await albumesRepositorio.buscarPorId(albumId);
  if (!album)
    throw new AppError(404, "ALBUM_NO_ENCONTRADO", "Álbum no encontrado");
  if (album.artistaId !== artistaId)
    throw new AppError(
      400,
      "ALBUM_NO_COINCIDE",
      "El álbum no pertenece al artista de la canción",
    );
}

export async function crear(datos: DatosCancion) {
  if (!(await artistasRepositorio.buscarPorId(datos.artistaId)))
    throw new AppError(404, "ARTISTA_NO_ENCONTRADO", "Artista no encontrado");
  if (datos.albumId) await validarAlbum(datos.albumId, datos.artistaId);
  return cancionesRepositorio.crear(datos);
}

export async function actualizar(id: string, datos: DatosActualizarCancion) {
  const actual = await obtener(id);
  if (datos.albumId) await validarAlbum(datos.albumId, actual.artistaId);
  return cancionesRepositorio.actualizar(id, datos);
}

export async function eliminar(id: string) {
  await obtener(id);
  await cancionesRepositorio.eliminar(id);
}
