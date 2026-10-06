import { z } from "zod";
import { esquemaPaginacion, textoBusqueda } from "../../utils/paginacion";

const fecha = z
  .string()
  .date()
  .transform((s) => new Date(s));

export const esquemaCrearAlbum = z
  .object({
    titulo: z.string().trim().min(1).max(160),
    artistaId: z.string().uuid(),
    fechaLanzamiento: fecha.nullable().optional(),
  })
  .strict();

// El artista de un álbum no se cambia: se elimina y se vuelve a crear
export const esquemaActualizarAlbum = esquemaCrearAlbum
  .omit({ artistaId: true })
  .partial()
  .refine((d) => Object.keys(d).length > 0, {
    message: "Debes enviar al menos un campo",
  });

export const esquemaListarAlbumes = esquemaPaginacion.extend({
  q: textoBusqueda.optional(),
  artistaId: z.string().uuid().optional(),
});

export type DatosAlbum = z.infer<typeof esquemaCrearAlbum>;
export type DatosActualizarAlbum = z.infer<typeof esquemaActualizarAlbum>;
export type FiltrosAlbumes = z.infer<typeof esquemaListarAlbumes>;
