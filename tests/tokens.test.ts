import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import {
  firmarTokenAcceso,
  firmarTokenRefresco,
  verificarTokenAcceso,
  verificarTokenRefresco,
} from "../src/modules/auth/tokens";

const ACCESS = "test_access_secret_1234567890";
const REFRESH = "test_refresh_secret_1234567890";
const usuario = { id: "u-1", rol: "USUARIO" as const };

describe("Tokens JWT", () => {
  it("el token de acceso se firma y verifica con su payload", () => {
    const payload = verificarTokenAcceso(firmarTokenAcceso(usuario));
    expect(payload).toEqual({ sub: "u-1", rol: "USUARIO" });
  });

  it("cada refresh token es único", () => {
    expect(firmarTokenRefresco("u-1").token).not.toBe(
      firmarTokenRefresco("u-1").token,
    );
  });

  it("el token de acceso no se acepta como refresh y viceversa", () => {
    expect(() => verificarTokenRefresco(firmarTokenAcceso(usuario))).toThrow();
    expect(() =>
      verificarTokenAcceso(firmarTokenRefresco("u-1").token),
    ).toThrow();
  });

  it("rechaza un token firmado con otro secreto", () => {
    const falso = jwt.sign(
      { rol: "ADMIN", tipo: "acceso" },
      "otro_secreto_distinto_123",
      { subject: "u-1", issuer: "musicapi" },
    );
    expect(() => verificarTokenAcceso(falso)).toThrow(/inválido/);
  });

  it("rechaza un token expirado con código TOKEN_EXPIRADO", () => {
    const vencido = jwt.sign({ rol: "USUARIO", tipo: "acceso" }, ACCESS, {
      subject: "u-1",
      issuer: "musicapi",
      expiresIn: -10,
    });
    expect(() => verificarTokenAcceso(vencido)).toThrowError(
      expect.objectContaining({ codigo: "TOKEN_EXPIRADO" }),
    );
  });

  it('rechaza tokens con algoritmo "none"', () => {
    const sinFirma = jwt.sign({ rol: "ADMIN", tipo: "acceso" }, "", {
      subject: "u-1",
      issuer: "musicapi",
      algorithm: "none",
    });
    expect(() => verificarTokenAcceso(sinFirma)).toThrow();
  });

  it("rechaza un emisor distinto", () => {
    const otro = jwt.sign({ rol: "USUARIO", tipo: "acceso" }, ACCESS, {
      subject: "u-1",
      issuer: "otro",
    });
    expect(() => verificarTokenAcceso(otro)).toThrow();
    expect(() =>
      verificarTokenRefresco(
        jwt.sign({ tipo: "refresco" }, REFRESH, { subject: "u-1" }),
      ),
    ).toThrow();
  });
});
