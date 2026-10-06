import type { Rol } from "@prisma/client";

export interface UsuarioAutenticado {
  id: string;
  rol: Rol;
}

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioAutenticado;
    }
  }
}
