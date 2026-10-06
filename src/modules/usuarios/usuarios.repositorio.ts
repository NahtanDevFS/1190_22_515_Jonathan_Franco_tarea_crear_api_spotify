import { prisma } from "../../config/prisma";

export const usuariosRepositorio = {
  buscarPorId: (id: string) => prisma.usuario.findUnique({ where: { id } }),

  buscarPorCorreo: (correo: string) =>
    prisma.usuario.findUnique({ where: { correo } }),

  crear: (datos: {
    correo: string;
    nombreUsuario: string;
    contrasenaHash: string;
  }) => prisma.usuario.create({ data: datos }),
};
