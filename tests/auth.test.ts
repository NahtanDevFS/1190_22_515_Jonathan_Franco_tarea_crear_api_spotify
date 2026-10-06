import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { bd, reiniciarBd } from "./helpers/bd-falsa";

type BdFalsa = typeof import("./helpers/bd-falsa");

vi.mock("../src/modules/usuarios/usuarios.repositorio", async () => ({
  usuariosRepositorio: (await vi.importActual<BdFalsa>("./helpers/bd-falsa"))
    .usuariosRepoFalso,
}));
vi.mock("../src/modules/auth/auth.repositorio", async () => ({
  authRepositorio: (await vi.importActual<BdFalsa>("./helpers/bd-falsa"))
    .authRepoFalso,
}));

const base = "/api/v1";
const datos = {
  correo: "ana@ejemplo.com",
  nombreUsuario: "ana_01",
  contrasena: "Secreta123",
};

const registrar = (cuerpo: object = datos) =>
  request(app).post(`${base}/auth/registro`).send(cuerpo);
const iniciarSesion = (
  cuerpo: object = { correo: datos.correo, contrasena: datos.contrasena },
) => request(app).post(`${base}/auth/iniciar-sesion`).send(cuerpo);
const refrescar = (tokenRefresco: string) =>
  request(app).post(`${base}/auth/refrescar`).send({ tokenRefresco });

beforeEach(() => reiniciarBd());

describe("POST /auth/registro", () => {
  it("crea el usuario y devuelve tokens sin exponer la contraseña", async () => {
    const res = await registrar();
    expect(res.status).toBe(201);
    expect(res.body.usuario).toMatchObject({
      correo: datos.correo,
      nombreUsuario: datos.nombreUsuario,
      rol: "USUARIO",
    });
    expect(res.body.usuario.contrasenaHash).toBeUndefined();
    expect(res.body.tokenAcceso).toBeTruthy();
    expect(res.body.tokenRefresco).toBeTruthy();
  });

  it("guarda el hash de la contraseña y el hash del refresh token (nunca en claro)", async () => {
    const res = await registrar();
    expect(bd.usuarios[0].contrasenaHash).not.toBe(datos.contrasena);
    expect(bd.usuarios[0].contrasenaHash.startsWith("$2")).toBe(true);
    expect(bd.tokens[0].hashToken).not.toBe(res.body.tokenRefresco);
    expect(bd.tokens[0].hashToken).toHaveLength(64);
  });

  it("normaliza el correo a minúsculas", async () => {
    const res = await registrar({ ...datos, correo: "  ANA@Ejemplo.COM " });
    expect(res.body.usuario.correo).toBe("ana@ejemplo.com");
  });

  it('rechaza el campo "rol" (no se puede auto-asignar ADMIN)', async () => {
    const res = await registrar({ ...datos, rol: "ADMIN" });
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe("VALIDACION_FALLIDA");
    expect(bd.usuarios).toHaveLength(0);
  });

  it("valida los datos y responde en español", async () => {
    const res = await registrar({
      correo: "no-es-correo",
      nombreUsuario: "a",
      contrasena: "corta",
    });
    expect(res.status).toBe(400);
    expect(res.body.error.detalles.correo).toContain(
      "Correo electrónico inválido",
    );
    expect(res.body.error.detalles.nombreUsuario[0]).toMatch(
      /al menos 3 caracteres/,
    );
    expect(res.body.error.detalles.contrasena[0]).toMatch(
      /al menos 8 caracteres/,
    );
  });

  it("exige letra y número en la contraseña", async () => {
    const res = await registrar({ ...datos, contrasena: "sololetrasaqui" });
    expect(res.status).toBe(400);
    expect(res.body.error.detalles.contrasena[0]).toMatch(/letra y un número/);
  });

  it("devuelve 409 si el correo o usuario ya existen", async () => {
    await registrar();
    const res = await registrar();
    expect(res.status).toBe(409);
    expect(res.body.error.codigo).toBe("USUARIO_EXISTENTE");
  });
});

describe("POST /auth/iniciar-sesion", () => {
  beforeEach(async () => {
    await registrar();
  });

  it("inicia sesión con credenciales correctas", async () => {
    const res = await iniciarSesion();
    expect(res.status).toBe(200);
    expect(res.body.tokenAcceso).toBeTruthy();
    expect(res.body.usuario.correo).toBe(datos.correo);
  });

  it("contraseña incorrecta y correo inexistente dan exactamente la misma respuesta", async () => {
    const mala = await iniciarSesion({
      correo: datos.correo,
      contrasena: "Incorrecta999",
    });
    const inexistente = await iniciarSesion({
      correo: "nadie@ejemplo.com",
      contrasena: "Incorrecta999",
    });
    expect(mala.status).toBe(401);
    expect(inexistente.status).toBe(401);
    expect(mala.body).toEqual(inexistente.body);
    expect(mala.body.error.codigo).toBe("CREDENCIALES_INVALIDAS");
  });
});

describe("GET /usuarios/yo (ruta protegida)", () => {
  it("sin token devuelve 401", async () => {
    const res = await request(app).get(`${base}/usuarios/yo`);
    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe("NO_AUTENTICADO");
  });

  it("con token de acceso válido devuelve el perfil", async () => {
    const { body } = await registrar();
    const res = await request(app)
      .get(`${base}/usuarios/yo`)
      .set("Authorization", `Bearer ${body.tokenAcceso}`);
    expect(res.status).toBe(200);
    expect(res.body.correo).toBe(datos.correo);
    expect(res.body.contrasenaHash).toBeUndefined();
  });

  it("un token mal formado devuelve 401 TOKEN_INVALIDO", async () => {
    const res = await request(app)
      .get(`${base}/usuarios/yo`)
      .set("Authorization", "Bearer basura");
    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe("TOKEN_INVALIDO");
  });

  it("un refresh token NO sirve como token de acceso", async () => {
    const { body } = await registrar();
    const res = await request(app)
      .get(`${base}/usuarios/yo`)
      .set("Authorization", `Bearer ${body.tokenRefresco}`);
    expect(res.status).toBe(401);
  });
});

describe("POST /auth/refrescar (rotación)", () => {
  it("entrega un par de tokens nuevo e invalida el anterior", async () => {
    const { body: sesion } = await registrar();
    const res = await refrescar(sesion.tokenRefresco);
    expect(res.status).toBe(200);
    expect(res.body.tokenRefresco).not.toBe(sesion.tokenRefresco);
    expect(res.body.tokenAcceso).toBeTruthy();
  });

  it("reutilizar un token ya rotado cierra TODAS las sesiones del usuario", async () => {
    const { body: sesion } = await registrar();
    const rotado = await refrescar(sesion.tokenRefresco);

    const reuso = await refrescar(sesion.tokenRefresco); // el atacante usa el token viejo
    expect(reuso.status).toBe(401);
    expect(reuso.body.error.codigo).toBe("TOKEN_REUTILIZADO");

    const legitimo = await refrescar(rotado.body.tokenRefresco); // el token nuevo también quedó revocado
    expect(legitimo.status).toBe(401);
  });

  it("un token inventado devuelve 401", async () => {
    const res = await refrescar("inventado");
    expect(res.status).toBe(401);
  });
});

describe("POST /auth/cerrar-sesion", () => {
  it("requiere estar autenticado", async () => {
    const { body } = await registrar();
    const res = await request(app)
      .post(`${base}/auth/cerrar-sesion`)
      .send({ tokenRefresco: body.tokenRefresco });
    expect(res.status).toBe(401);
  });

  it("elimina el refresh token y no afecta las otras sesiones", async () => {
    const { body: a } = await registrar();
    const { body: b } = await iniciarSesion();

    const res = await request(app)
      .post(`${base}/auth/cerrar-sesion`)
      .set("Authorization", `Bearer ${a.tokenAcceso}`)
      .send({ tokenRefresco: a.tokenRefresco });
    expect(res.status).toBe(204);

    expect((await refrescar(a.tokenRefresco)).status).toBe(401); // sesión cerrada
    expect((await refrescar(b.tokenRefresco)).status).toBe(200); // otra sesión sigue activa
  });

  it("no permite cerrar la sesión de otro usuario", async () => {
    const { body: ana } = await registrar();
    const { body: luis } = await registrar({
      correo: "luis@ejemplo.com",
      nombreUsuario: "luis",
      contrasena: "Secreta123",
    });

    await request(app)
      .post(`${base}/auth/cerrar-sesion`)
      .set("Authorization", `Bearer ${luis.tokenAcceso}`)
      .send({ tokenRefresco: ana.tokenRefresco });

    expect((await refrescar(ana.tokenRefresco)).status).toBe(200); // el token de Ana sigue válido
  });
});
