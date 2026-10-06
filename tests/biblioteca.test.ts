import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { firmarTokenAcceso } from "../src/modules/auth/tokens";

const m = vi.hoisted(() => ({
  listas: {
    crear: vi.fn(),
    listarDeUsuario: vi.fn(),
    buscarPorId: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn(),
    agregarCancion: vi.fn(),
    quitarCancion: vi.fn(),
  },
  canciones: { buscarPorId: vi.fn() },
  favoritos: { listar: vi.fn(), agregar: vi.fn(), quitar: vi.fn() },
  historial: { registrar: vi.fn(), listar: vi.fn(), limpiar: vi.fn() },
}));

vi.mock("../src/modules/listas/listas.repositorio", () => ({
  listasRepositorio: m.listas,
}));
vi.mock("../src/modules/canciones/canciones.repositorio", () => ({
  cancionesRepositorio: m.canciones,
  incluirCancion: {},
}));
vi.mock("../src/modules/favoritos/favoritos.repositorio", () => ({
  favoritosRepositorio: m.favoritos,
}));
vi.mock("../src/modules/historial/historial.repositorio", () => ({
  historialRepositorio: m.historial,
}));

const base = "/api/v1";
const yo = "11111111-1111-4111-8111-111111111111";
const otro = "22222222-2222-4222-8222-222222222222";
const idLista = "33333333-3333-4333-8333-333333333333";
const idCancion = "44444444-4444-4444-8444-444444444444";
const auth = `Bearer ${firmarTokenAcceso({ id: yo, rol: "USUARIO" })}`;

const lista = (propietarioId: string, esPublica = false) => ({
  id: idLista,
  nombre: "Para correr",
  esPublica,
  propietarioId,
  creadoEn: new Date(),
  canciones: [],
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Listas de reproducción", () => {
  it("exige autenticación", async () => {
    expect((await request(app).get(`${base}/listas`)).status).toBe(401);
  });

  it("crea la lista a nombre del usuario autenticado (ignora propietarioId)", async () => {
    m.listas.crear.mockResolvedValue(lista(yo));
    const res = await request(app)
      .post(`${base}/listas`)
      .set("Authorization", auth)
      .send({ nombre: "Para correr" });
    expect(res.status).toBe(201);
    expect(m.listas.crear).toHaveBeenCalledWith({
      nombre: "Para correr",
      esPublica: false,
      propietarioId: yo,
    });
    const intento = await request(app)
      .post(`${base}/listas`)
      .set("Authorization", auth)
      .send({ nombre: "X", propietarioId: otro });
    expect(intento.status).toBe(400);
  });

  it("una lista privada ajena responde 404 (no revela que existe)", async () => {
    m.listas.buscarPorId.mockResolvedValue(lista(otro, false));
    const res = await request(app)
      .get(`${base}/listas/${idLista}`)
      .set("Authorization", auth);
    expect(res.status).toBe(404);
  });

  it("una lista pública ajena se puede ver pero no modificar", async () => {
    m.listas.buscarPorId.mockResolvedValue(lista(otro, true));
    const ver = await request(app)
      .get(`${base}/listas/${idLista}`)
      .set("Authorization", auth);
    expect(ver.status).toBe(200);

    const editar = await request(app)
      .patch(`${base}/listas/${idLista}`)
      .set("Authorization", auth)
      .send({ nombre: "Mía ahora" });
    expect(editar.status).toBe(403);
    const borrar = await request(app)
      .delete(`${base}/listas/${idLista}`)
      .set("Authorization", auth);
    expect(borrar.status).toBe(403);
    const agregar = await request(app)
      .post(`${base}/listas/${idLista}/canciones`)
      .set("Authorization", auth)
      .send({ cancionId: idCancion });
    expect(agregar.status).toBe(403);
    expect(m.listas.actualizar).not.toHaveBeenCalled();
    expect(m.listas.eliminar).not.toHaveBeenCalled();
    expect(m.listas.agregarCancion).not.toHaveBeenCalled();
  });

  it("el propietario edita y elimina", async () => {
    m.listas.buscarPorId.mockResolvedValue(lista(yo));
    m.listas.actualizar.mockResolvedValue(lista(yo, true));
    const editar = await request(app)
      .patch(`${base}/listas/${idLista}`)
      .set("Authorization", auth)
      .send({ esPublica: true });
    expect(editar.status).toBe(200);
    const borrar = await request(app)
      .delete(`${base}/listas/${idLista}`)
      .set("Authorization", auth);
    expect(borrar.status).toBe(204);
  });

  it("agregar canción: 404 si no existe y 409 si está duplicada", async () => {
    m.listas.buscarPorId.mockResolvedValue(lista(yo));
    m.canciones.buscarPorId.mockResolvedValueOnce(null);
    const noExiste = await request(app)
      .post(`${base}/listas/${idLista}/canciones`)
      .set("Authorization", auth)
      .send({ cancionId: idCancion });
    expect(noExiste.status).toBe(404);

    m.canciones.buscarPorId.mockResolvedValue({ id: idCancion });
    m.listas.agregarCancion.mockResolvedValue(false);
    const duplicada = await request(app)
      .post(`${base}/listas/${idLista}/canciones`)
      .set("Authorization", auth)
      .send({ cancionId: idCancion });
    expect(duplicada.status).toBe(409);
    expect(duplicada.body.error.codigo).toBe("CANCION_DUPLICADA");
  });

  it("agregar canción devuelve la lista con sus canciones", async () => {
    m.canciones.buscarPorId.mockResolvedValue({ id: idCancion });
    m.listas.agregarCancion.mockResolvedValue(true);
    m.listas.buscarPorId.mockResolvedValue({
      ...lista(yo),
      canciones: [
        {
          posicion: 1,
          agregadaEn: new Date(),
          cancion: { id: idCancion, titulo: "Té para tres" },
        },
      ],
    });
    const res = await request(app)
      .post(`${base}/listas/${idLista}/canciones`)
      .set("Authorization", auth)
      .send({ cancionId: idCancion });
    expect(res.status).toBe(201);
    expect(res.body.canciones[0]).toMatchObject({
      id: idCancion,
      posicion: 1,
      titulo: "Té para tres",
    });
  });

  it("quitar una canción que no está en la lista responde 404", async () => {
    m.listas.buscarPorId.mockResolvedValue(lista(yo));
    m.listas.quitarCancion.mockResolvedValue({ count: 0 });
    const res = await request(app)
      .delete(`${base}/listas/${idLista}/canciones/${idCancion}`)
      .set("Authorization", auth);
    expect(res.status).toBe(404);
  });
});

describe("Favoritos", () => {
  it("marca como favorita (idempotente) usando el usuario del token", async () => {
    m.canciones.buscarPorId.mockResolvedValue({ id: idCancion });
    const res = await request(app)
      .put(`${base}/favoritos/${idCancion}`)
      .set("Authorization", auth);
    expect(res.status).toBe(200);
    expect(m.favoritos.agregar).toHaveBeenCalledWith(yo, idCancion);
  });

  it("404 al marcar una canción inexistente", async () => {
    m.canciones.buscarPorId.mockResolvedValue(null);
    const res = await request(app)
      .put(`${base}/favoritos/${idCancion}`)
      .set("Authorization", auth);
    expect(res.status).toBe(404);
  });

  it("lista solo las canciones", async () => {
    m.favoritos.listar.mockResolvedValue([[{ cancion: { id: idCancion } }], 1]);
    const res = await request(app)
      .get(`${base}/favoritos`)
      .set("Authorization", auth);
    expect(res.body.datos).toEqual([{ id: idCancion }]);
    expect(m.favoritos.listar).toHaveBeenCalledWith(yo, 0, 20);
  });

  it("quitar un favorito inexistente responde 404", async () => {
    m.favoritos.quitar.mockResolvedValue({ count: 0 });
    const res = await request(app)
      .delete(`${base}/favoritos/${idCancion}`)
      .set("Authorization", auth);
    expect(res.status).toBe(404);
  });
});

describe("Historial", () => {
  it("registra una reproducción", async () => {
    m.canciones.buscarPorId.mockResolvedValue({ id: idCancion });
    m.historial.registrar.mockResolvedValue({ id: "h-1" });
    const res = await request(app)
      .post(`${base}/historial`)
      .set("Authorization", auth)
      .send({ cancionId: idCancion });
    expect(res.status).toBe(201);
    expect(m.historial.registrar).toHaveBeenCalledWith(yo, idCancion);
  });

  it("valida el cuerpo", async () => {
    const res = await request(app)
      .post(`${base}/historial`)
      .set("Authorization", auth)
      .send({ cancionId: "no-uuid" });
    expect(res.status).toBe(400);
  });

  it("lista y limpia solo el historial propio", async () => {
    m.historial.listar.mockResolvedValue([
      [{ id: "h-1", reproducidaEn: new Date(), cancion: { id: idCancion } }],
      1,
    ]);
    const lista = await request(app)
      .get(`${base}/historial`)
      .set("Authorization", auth);
    expect(lista.status).toBe(200);
    expect(lista.body.datos[0].cancion.id).toBe(idCancion);
    expect(m.historial.listar).toHaveBeenCalledWith(yo, 0, 20);

    const limpiar = await request(app)
      .delete(`${base}/historial`)
      .set("Authorization", auth);
    expect(limpiar.status).toBe(204);
    expect(m.historial.limpiar).toHaveBeenCalledWith(yo);
  });
});
