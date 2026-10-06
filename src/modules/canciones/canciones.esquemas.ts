import { z } from "zod";
import { esquemaPaginacion, textoBusqueda } from "../../utils/paginacion";

export const esquemaCrearCancion = z
  .object({
    titulo: z.string().trim().min(1).max(160),
    duracionSeg: z.number().int().min(1).max(7200),
    artistaId: z.string().uuid(),
    albumId: z.string().uuid().nullable().optional(),
  })
  .strict();

export const esquemaActualizarCancion = esquemaCrearCancion
  .omit({ artistaId: true })
  .partial()
  .refine((d) => Object.keys(d).length > 0, {
    message: "Debes enviar al menos un campo",
  });

export const esquemaListarCanciones = esquemaPaginacion.extend({
  q: textoBusqueda.optional(),
  artistaId: z.string().uuid().optional(),
  albumId: z.string().uuid().optional(),
});

export type DatosCancion = z.infer<typeof esquemaCrearCancion>;
export type DatosActualizarCancion = z.infer<typeof esquemaActualizarCancion>;
export type FiltrosCanciones = z.infer<typeof esquemaListarCanciones>;
