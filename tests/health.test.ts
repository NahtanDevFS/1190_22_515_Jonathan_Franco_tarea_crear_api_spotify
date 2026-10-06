import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app";

// Estas pruebas no usan la base de datos: se evita crear el cliente de Prisma
vi.mock("../src/config/prisma", () => ({ prisma: {} }));

describe("Base de la API", () => {
  it("GET /health responde ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe("ok");
  });

  it("ruta inexistente devuelve 404 con formato estándar", async () => {
    const res = await request(app).get("/nada");
    expect(res.status).toBe(404);
    expect(res.body.error.codigo).toBe("NO_ENCONTRADO");
  });

  it("JSON mal formado devuelve 400 JSON_INVALIDO", async () => {
    const res = await request(app)
      .post("/api/v1/auth/registro")
      .set("Content-Type", "application/json")
      .send('{"correo": ');
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe("JSON_INVALIDO");
  });

  it("cuerpo demasiado grande devuelve 413", async () => {
    const res = await request(app)
      .post("/api/v1/auth/registro")
      .send({ relleno: "x".repeat(200_000) });
    expect(res.status).toBe(413);
    expect(res.body.error.codigo).toBe("CUERPO_DEMASIADO_GRANDE");
  });
});
