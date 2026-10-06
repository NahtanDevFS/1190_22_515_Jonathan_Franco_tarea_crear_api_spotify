import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { autenticar, requerirRol } from "../src/middlewares/autenticacion";
import { manejadorErrores } from "../src/middlewares/errorHandler";
import { firmarTokenAcceso } from "../src/modules/auth/tokens";
import { crearLimitador } from "../src/middlewares/limitadores";

const mini = express();
mini.get("/solo-admin", autenticar, requerirRol("ADMIN"), (_req, res) => {
  res.json({ ok: true });
});
mini.use(manejadorErrores);

describe("Control de acceso por rol", () => {
  it("un USUARIO recibe 403 en una ruta de ADMIN", async () => {
    const token = firmarTokenAcceso({ id: "u-1", rol: "USUARIO" });
    const res = await request(mini)
      .get("/solo-admin")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error.codigo).toBe("PROHIBIDO");
  });

  it("un ADMIN accede", async () => {
    const token = firmarTokenAcceso({ id: "a-1", rol: "ADMIN" });
    const res = await request(mini)
      .get("/solo-admin")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("sin token recibe 401", async () => {
    expect((await request(mini).get("/solo-admin")).status).toBe(401);
  });
});

describe("Limitador de peticiones", () => {
  it("responde 429 al superar el límite", async () => {
    const lim = express();
    lim.use(crearLimitador({ limit: 2, skip: () => false }));
    lim.get("/", (_req, res) => {
      res.send("ok");
    });
    lim.use(manejadorErrores);

    expect((await request(lim).get("/")).status).toBe(200);
    expect((await request(lim).get("/")).status).toBe(200);
    const tercera = await request(lim).get("/");
    expect(tercera.status).toBe(429);
    expect(tercera.body.error.codigo).toBe("DEMASIADAS_PETICIONES");
  });
});
