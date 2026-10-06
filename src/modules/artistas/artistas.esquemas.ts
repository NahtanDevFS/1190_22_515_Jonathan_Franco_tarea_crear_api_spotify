import { z } from "zod";
import { esquemaPaginacion, textoBusqueda } from "../../utils/paginacion";

export const esquemaCrearArtista = z
  .object({
    nombre: z.string().trim().min(1).max(120),
    biografia: z.string().trim().max(2000).nullable().optional(),
  })
  .strict();

export const esquemaActualizarArtista = esquemaCrearArtista
  .partial()
  .refine((d) => Object.keys(d).length > 0, {
    message: "Debes enviar al menos un campo",
  });

export const esquemaListarArtistas = esquemaPaginacion.extend({
  q: textoBusqueda.optional(),
});

export type DatosArtista = z.infer<typeof esquemaCrearArtista>;
export type DatosActualizarArtista = z.infer<typeof esquemaActualizarArtista>;
export type FiltrosArtistas = z.infer<typeof esquemaListarArtistas>;
