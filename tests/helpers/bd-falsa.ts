import { randomUUID } from "node:crypto";

// Base de datos en memoria que imita el comportamiento de los repositorios reales.
interface UsuarioFalso {
  id: string;
  correo: string;
  nombreUsuario: string;
  contrasenaHash: string;
  rol: "USUARIO" | "ADMIN";
  creadoEn: Date;
  actualizadoEn: Date;
}
interface TokenFalso {
  id: string;
  hashToken: string;
  usuarioId: string;
  expiraEn: Date;
  revocadoEn: Date | null;
  creadoEn: Date;
}

export const bd = {
  usuarios: [] as UsuarioFalso[],
  tokens: [] as TokenFalso[],
};

export function reiniciarBd() {
  bd.usuarios = [];
  bd.tokens = [];
}

export const usuariosRepoFalso = {
  buscarPorId: async (id: string) =>
    bd.usuarios.find((u) => u.id === id) ?? null,
  buscarPorCorreo: async (correo: string) =>
    bd.usuarios.find((u) => u.correo === correo) ?? null,
  crear: async (datos: {
    correo: string;
    nombreUsuario: string;
    contrasenaHash: string;
  }) => {
    if (
      bd.usuarios.some(
        (u) =>
          u.correo === datos.correo || u.nombreUsuario === datos.nombreUsuario,
      )
    ) {
      throw Object.assign(new Error("Unique constraint failed"), {
        code: "P2002",
      });
    }
    const ahora = new Date();
    const usuario: UsuarioFalso = {
      id: randomUUID(),
      rol: "USUARIO",
      creadoEn: ahora,
      actualizadoEn: ahora,
      ...datos,
    };
    bd.usuarios.push(usuario);
    return usuario;
  },
};

export const authRepoFalso = {
  crearTokenRefresco: async (datos: {
    hashToken: string;
    usuarioId: string;
    expiraEn: Date;
  }) => {
    const t: TokenFalso = {
      id: randomUUID(),
      revocadoEn: null,
      creadoEn: new Date(),
      ...datos,
    };
    bd.tokens.push(t);
    return t;
  },
  buscarPorHash: async (hashToken: string) =>
    bd.tokens.find((t) => t.hashToken === hashToken) ?? null,
  rotar: async (
    idViejo: string,
    nuevo: { hashToken: string; usuarioId: string; expiraEn: Date },
  ) => {
    const viejo = bd.tokens.find(
      (t) => t.id === idViejo && t.revocadoEn === null,
    );
    if (!viejo) return false;
    viejo.revocadoEn = new Date();
    bd.tokens.push({
      id: randomUUID(),
      revocadoEn: null,
      creadoEn: new Date(),
      ...nuevo,
    });
    return true;
  },
  revocarTodosDelUsuario: async (usuarioId: string) => {
    for (const t of bd.tokens)
      if (t.usuarioId === usuarioId && t.revocadoEn === null)
        t.revocadoEn = new Date();
  },
  eliminarPorHash: async (hashToken: string, usuarioId: string) => {
    bd.tokens = bd.tokens.filter(
      (t) => !(t.hashToken === hashToken && t.usuarioId === usuarioId),
    );
  },
};
