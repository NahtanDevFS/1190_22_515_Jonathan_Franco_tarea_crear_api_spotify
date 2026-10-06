import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("Base de la API", () => {
  it("GET /health responde ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("ruta inexistente devuelve 404 con formato estándar", async () => {
    const res = await request(app).get("/nada");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
