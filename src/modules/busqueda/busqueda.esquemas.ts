import { z } from "zod";
import { textoBusqueda } from "../../utils/paginacion";

export const esquemaBusqueda = z.object({
  q: textoBusqueda,
  limite: z.coerce.number().int().min(1).max(25).default(10),
});

export type ParametrosBusqueda = z.infer<typeof esquemaBusqueda>;
