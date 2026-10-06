import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { firmarTokenAcceso } from "../src/modules/auth/tokens";

const m = vi.hoisted(() => ({
  artistas: {
    listar: vi.fn(),
    buscarPorId: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn(),
  },
  albumes: { buscarPorId: vi.fn() },
  canciones: {
    listar: vi.fn(),
    buscarPorId: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn(),
  },
  busqueda: { buscar: vi.fn() },
}));

vi.mock("../src/modules/artistas/artistas.repositorio", () => ({
  artistasRepositorio: m.artistas,
}));
vi.mock("../src/modules/albumes/albumes.repositorio", () => ({
  albumesRepositorio: m.albumes,
  incluirArtista: {},
}));
vi.mock("../src/modules/canciones/canciones.repositorio", () => ({
  cancionesRepositorio: m.canciones,
  incluirCancion: {},
}));
vi.mock("../src/modules/busqueda/busqueda.repositorio", () => ({
  busquedaRepositorio: m.busqueda,
}));

const base = "/api/v1";
const id = "6f1f0a52-8f0e-4f6b-9a39-1d0f4c1f2a11";
const idArtista = "0b6f3c9e-3d38-4b0e-8f8f-5f8b5c7e1a22";
const token = (rol: "USUARIO" | "ADMIN") =>
  `Bearer ${firmarTokenAcceso({ id: "u-1", rol })}`;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Catálogo: control de acceso", () => {
  it("sin token responde 401 en lectura", async () => {
    expect((await request(app).get(`${base}/artistas`)).status).toBe(401);
  });

  it("un USUARIO puede listar", async () => {
    m.artistas.listar.mockResolvedValue([[{ id, nombre: "Soda Stereo" }], 1]);
    const res = await request(app)
      .get(`${base}/artistas?q=soda`)
      .set("Authorization", token("USUARIO"));
    expect(res.status).toBe(200);
    expect(res.body.datos).toHaveLength(1);
    expect(res.body.paginacion).toMatchObject({ pagina: 1, limite: 20, total: 1 });
    expect(m.artistas.listar).toHaveBeenCalledWith({ q: "soda", skip: 0, take: 20 });
  });

  it.each([
    ["post", `${base}/artistas`, { nombre: "X" }],
    ["patch", `${base}/artistas/${id}`, { nombre: "X" }],
    ["delete", `${base}/artistas/${id}`, undefined],
    ["post", `${base}/canciones`, { titulo: "X", duracionSeg: 10, artistaId: id }],
  ] as const)("un USUARIO recibe 403 en %s %s", async (metodo, ruta, cuerpo) => {
    const peticion = request(app)[metodo](ruta);
    const res = await peticion
      .set("Authorization", token("USUARIO"))
      .send(cuerpo);
    expect(res.status).toBe(403);
  });
});

describe("Catálogo: artistas (ADMIN)", () => {
  it("crea un artista", async () => {
    m.artistas.crear.mockResolvedValue({ id, nombre: "Soda Stereo", biografia: null });
    const res = await request(app)
      .post(`${base}/artistas`)
      .set("Authorization", token("ADMIN"))
      .send({ nombre: "  Soda Stereo  " });
    expect(res.status).toBe(201);
    expect(m.artistas.crear).toHaveBeenCalledWith({ nombre: "Soda Stereo" });
  });

  it("rechaza campos desconocidos y cuerpos vacíos (400)", async () => {
    const admin = token("ADMIN");
    const extra = await request(app)
      .post(`${base}/artistas`)
      .set("Authorization", admin)
      .send({ nombre: "X", id: "forzado" });
    expect(extra.status).toBe(400);
    expect(extra.body.error.codigo).toBe("VALIDACION_FALLIDA");
    const vacio = await request(app)
      .patch(`${base}/artistas/${id}`)
      .set("Authorization", admin)
      .send({});
    expect(vacio.status).toBe(400);
  });

  it("responde 400 con un id que no es UUID y 404 si no existe", async () => {
    const admin = token("ADMIN");
    expect(
      (await request(app).get(`${base}/artistas/abc`).set("Authorization", admin)).status,
    ).toBe(400);
    m.artistas.buscarPorId.mockResolvedValue(null);
    const res = await request(app)
      .delete(`${base}/artistas/${id}`)
      .set("Authorization", admin);
    expect(res.status).toBe(404);
    expect(res.body.error.codigo).toBe("ARTISTA_NO_ENCONTRADO");
    expect(m.artistas.eliminar).not.toHaveBeenCalled();
  });

  it("limita el tamaño de página a 100", async () => {
    const res = await request(app)
      .get(`${base}/artistas?limite=1000`)
      .set("Authorization", token("USUARIO"));
    expect(res.status).toBe(400);
  });
});

describe("Catálogo: canciones", () => {
  const cuerpo = { titulo: "Té para tres", duracionSeg: 258, artistaId: idArtista };

  it("404 si el artista no existe", async () => {
    m.artistas.buscarPorId.mockResolvedValue(null);
    const res = await request(app)
      .post(`${base}/canciones`)
      .set("Authorization", token("ADMIN"))
      .send(cuerpo);
    expect(res.status).toBe(404);
  });

  it("400 si el álbum pertenece a otro artista", async () => {
    m.artistas.buscarPorId.mockResolvedValue({ id: idArtista });
    m.albumes.buscarPorId.mockResolvedValue({ id, artistaId: "otro" });
    const res = await request(app)
      .post(`${base}/canciones`)
      .set("Authorization", token("ADMIN"))
      .send({ ...cuerpo, albumId: id });
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe("ALBUM_NO_COINCIDE");
  });

  it("crea la canción cuando todo es válido", async () => {
    m.artistas.buscarPorId.mockResolvedValue({ id: idArtista });
    m.canciones.crear.mockResolvedValue({ id, ...cuerpo });
    const res = await request(app)
      .post(`${base}/canciones`)
      .set("Authorization", token("ADMIN"))
      .send(cuerpo);
    expect(res.status).toBe(201);
  });

  it("valida la duración", async () => {
    const res = await request(app)
      .post(`${base}/canciones`)
      .set("Authorization", token("ADMIN"))
      .send({ ...cuerpo, duracionSeg: -5 });
    expect(res.status).toBe(400);
  });
});

describe("Búsqueda", () => {
  it("exige el parámetro q", async () => {
    const res = await request(app)
      .get(`${base}/buscar`)
      .set("Authorization", token("USUARIO"));
    expect(res.status).toBe(400);
  });

  it("devuelve artistas, álbumes y canciones", async () => {
    m.busqueda.buscar.mockResolvedValue([[{ id }], [], []]);
    const res = await request(app)
      .get(`${base}/buscar?q=soda`)
      .set("Authorization", token("USUARIO"));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ artistas: [{ id }], albumes: [], canciones: [] });
    expect(m.busqueda.buscar).toHaveBeenCalledWith("soda", 10);
  });
});

describe("Documentación", () => {
  it("sirve la especificación OpenAPI", async () => {
    const res = await request(app).get("/api-docs.yaml");
    expect(res.status).toBe(200);
    expect(res.text).toContain("openapi: 3.0.3");
    expect(res.text).toContain("/listas/{id}/canciones");
  });

  it("sirve la interfaz Swagger UI", async () => {
    expect((await request(app).get("/api-docs/")).status).toBe(200);
  });
});
