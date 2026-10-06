import { busquedaRepositorio } from "./busqueda.repositorio";
import type { ParametrosBusqueda } from "./busqueda.esquemas";

export async function buscar({ q, limite }: ParametrosBusqueda) {
  const [artistas, albumes, canciones] = await busquedaRepositorio.buscar(
    q,
    limite,
  );
  return { artistas, albumes, canciones };
}
