import { AppError } from "../../utils/AppError";
import { paginar, saltar, type Paginacion } from "../../utils/paginacion";
import { cancionesRepositorio } from "../canciones/canciones.repositorio";
import { historialRepositorio } from "./historial.repositorio";

export async function registrar(usuarioId: string, cancionId: string) {
  if (!(await cancionesRepositorio.buscarPorId(cancionId)))
    throw new AppError(404, "CANCION_NO_ENCONTRADA", "Canción no encontrada");
  return historialRepositorio.registrar(usuarioId, cancionId);
}

export async function listar(usuarioId: string, p: Paginacion) {
  const [filas, total] = await historialRepositorio.listar(
    usuarioId,
    saltar(p),
    p.limite,
  );
  return paginar(
    filas.map((h) => ({
      id: h.id,
      reproducidaEn: h.reproducidaEn,
      cancion: h.cancion,
    })),
    total,
    p,
  );
}

export async function limpiar(usuarioId: string) {
  await historialRepositorio.limpiar(usuarioId);
}
