import { AppError } from "../../utils/AppError";
import { paginar, saltar, type Paginacion } from "../../utils/paginacion";
import { cancionesRepositorio } from "../canciones/canciones.repositorio";
import { favoritosRepositorio } from "./favoritos.repositorio";

export async function listar(usuarioId: string, p: Paginacion) {
  const [filas, total] = await favoritosRepositorio.listar(
    usuarioId,
    saltar(p),
    p.limite,
  );
  return paginar(
    filas.map((f) => f.cancion),
    total,
    p,
  );
}

export async function agregar(usuarioId: string, cancionId: string) {
  const cancion = await cancionesRepositorio.buscarPorId(cancionId);
  if (!cancion)
    throw new AppError(404, "CANCION_NO_ENCONTRADA", "Canción no encontrada");
  await favoritosRepositorio.agregar(usuarioId, cancionId);
  return cancion;
}

export async function quitar(usuarioId: string, cancionId: string) {
  const { count } = await favoritosRepositorio.quitar(usuarioId, cancionId);
  if (count === 0)
    throw new AppError(
      404,
      "FAVORITO_NO_ENCONTRADO",
      "La canción no está en tus favoritos",
    );
}
