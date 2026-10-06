import { z } from "zod";

export const esquemaPaginacion = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
});

export const esquemaId = z.object({ id: z.string().uuid() });

export const textoBusqueda = z.string().trim().min(1).max(100);

export type Paginacion = z.infer<typeof esquemaPaginacion>;

export const saltar = ({ pagina, limite }: Paginacion) =>
  (pagina - 1) * limite;

export function paginar<T>(datos: T[], total: number, p: Paginacion) {
  return {
    datos,
    paginacion: {
      pagina: p.pagina,
      limite: p.limite,
      total,
      totalPaginas: Math.ceil(total / p.limite),
    },
  };
}
