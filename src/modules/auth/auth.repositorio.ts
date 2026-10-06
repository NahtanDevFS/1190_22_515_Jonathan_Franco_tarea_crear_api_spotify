import { prisma } from "../../config/prisma";

interface NuevoTokenRefresco {
  hashToken: string;
  usuarioId: string;
  expiraEn: Date;
}

export const authRepositorio = {
  crearTokenRefresco: (datos: NuevoTokenRefresco) =>
    prisma.tokenRefresco.create({ data: datos }),

  buscarPorHash: (hashToken: string) =>
    prisma.tokenRefresco.findUnique({ where: { hashToken } }),

  // Rotación atómica: revoca el token viejo y crea el nuevo en una sola transacción.
  // Devuelve false si el token viejo ya estaba revocado (uso concurrente o reutilización).
  rotar: (idViejo: string, nuevo: NuevoTokenRefresco) =>
    prisma.$transaction(async (tx) => {
      const resultado = await tx.tokenRefresco.updateMany({
        where: { id: idViejo, revocadoEn: null },
        data: { revocadoEn: new Date() },
      });
      if (resultado.count !== 1) return false;
      await tx.tokenRefresco.create({ data: nuevo });
      return true;
    }),

  revocarTodosDelUsuario: (usuarioId: string) =>
    prisma.tokenRefresco.updateMany({
      where: { usuarioId, revocadoEn: null },
      data: { revocadoEn: new Date() },
    }),

  // Cierre de sesión: elimina el token (solo si pertenece al usuario)
  eliminarPorHash: (hashToken: string, usuarioId: string) =>
    prisma.tokenRefresco.deleteMany({ where: { hashToken, usuarioId } }),
};
