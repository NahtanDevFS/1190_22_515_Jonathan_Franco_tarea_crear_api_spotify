import { z } from "zod";
import { esquemaPaginacion } from "../../utils/paginacion";

export const esquemaCrearLista = z
  .object({
    nombre: z.string().trim().min(1).max(100),
    esPublica: z.boolean().default(false),
  })
  .strict();

export const esquemaActualizarLista = z
  .object({
    nombre: z.string().trim().min(1).max(100),
    esPublica: z.boolean(),
  })
  .partial()
  .strict()
  .refine((d) => Object.keys(d).length > 0, {
    message: "Debes enviar al menos un campo",
  });

export const esquemaAgregarCancion = z
  .object({ cancionId: z.string().uuid() })
  .strict();

export const esquemaParamsListaCancion = z.object({
  id: z.string().uuid(),
  cancionId: z.string().uuid(),
});

export const esquemaListarListas = esquemaPaginacion;

export type DatosCrearLista = z.infer<typeof esquemaCrearLista>;
export type DatosActualizarLista = z.infer<typeof esquemaActualizarLista>;
