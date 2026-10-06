import { AppError } from "../../utils/AppError";
import { paginar, saltar, type Paginacion } from "../../utils/paginacion";
import { cancionesRepositorio } from "../canciones/canciones.repositorio";
import { listasRepositorio } from "./listas.repositorio";
import type { DatosActualizarLista, DatosCrearLista } from "./listas.esquemas";

const noEncontrada = () =>
  new AppError(404, "LISTA_NO_ENCONTRADA", "Lista de reproducción no encontrada");

type ListaConCanciones = NonNullable<
  Awaited<ReturnType<typeof listasRepositorio.buscarPorId>>
>;

function darForma(lista: ListaConCanciones) {
  const { canciones, ...resto } = lista;
  return {
    ...resto,
    canciones: canciones.map((lc) => ({
      posicion: lc.posicion,
      agregadaEn: lc.agregadaEn,
      ...lc.cancion,
    })),
  };
}

// Una lista privada ajena responde 404 (no se revela que existe)
async function obtenerVisible(id: string, usuarioId: string) {
  const lista = await listasRepositorio.buscarPorId(id);
  if (!lista || (!lista.esPublica && lista.propietarioId !== usuarioId))
    throw noEncontrada();
  return lista;
}

// Para modificar: además de verla, hay que ser el propietario
async function obtenerPropia(id: string, usuarioId: string) {
  const lista = await obtenerVisible(id, usuarioId);
  if (lista.propietarioId !== usuarioId)
    throw new AppError(
      403,
      "PROHIBIDO",
      "Solo el propietario puede modificar la lista",
    );
  return lista;
}

export const crear = (usuarioId: string, datos: DatosCrearLista) =>
  listasRepositorio.crear({ ...datos, propietarioId: usuarioId });

export async function listarPropias(usuarioId: string, p: Paginacion) {
  const [datos, total] = await listasRepositorio.listarDeUsuario(
    usuarioId,
    saltar(p),
    p.limite,
  );
  return paginar(datos, total, p);
}

export async function obtener(id: string, usuarioId: string) {
  return darForma(await obtenerVisible(id, usuarioId));
}

export async function actualizar(
  id: string,
  usuarioId: string,
  datos: DatosActualizarLista,
) {
  await obtenerPropia(id, usuarioId);
  return listasRepositorio.actualizar(id, datos);
}

export async function eliminar(id: string, usuarioId: string) {
  await obtenerPropia(id, usuarioId);
  await listasRepositorio.eliminar(id);
}

export async function agregarCancion(
  id: string,
  usuarioId: string,
  cancionId: string,
) {
  await obtenerPropia(id, usuarioId);
  if (!(await cancionesRepositorio.buscarPorId(cancionId)))
    throw new AppError(404, "CANCION_NO_ENCONTRADA", "Canción no encontrada");
  if (!(await listasRepositorio.agregarCancion(id, cancionId)))
    throw new AppError(
      409,
      "CANCION_DUPLICADA",
      "La canción ya está en la lista",
    );
  return darForma(await obtenerVisible(id, usuarioId));
}

export async function quitarCancion(
  id: string,
  usuarioId: string,
  cancionId: string,
) {
  await obtenerPropia(id, usuarioId);
  const { count } = await listasRepositorio.quitarCancion(id, cancionId);
  if (count === 0)
    throw new AppError(
      404,
      "CANCION_NO_EN_LISTA",
      "La canción no está en la lista",
    );
}
