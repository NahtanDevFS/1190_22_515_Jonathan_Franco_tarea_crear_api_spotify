// Especificación OpenAPI 3.0 de la API (se sirve en /api-docs y /api-docs.yaml)

type Obj = Record<string, unknown>;

const ref = (nombre: string) => ({ $ref: `#/components/schemas/${nombre}` });
const cuerpo = (nombre: string) => ({
  required: true,
  content: { "application/json": { schema: ref(nombre) } },
});
const ok = (descripcion: string, schema?: Obj) => ({
  description: descripcion,
  ...(schema && { content: { "application/json": { schema } } }),
});
const err = (descripcion: string) => ({
  description: descripcion,
  content: { "application/json": { schema: ref("Error") } },
});
const paginada = (item: string) => ({
  type: "object",
  properties: {
    datos: { type: "array", items: ref(item) },
    paginacion: ref("Paginacion"),
  },
});
const idParam = (nombre = "id", desc = "Identificador (UUID)") => ({
  name: nombre,
  in: "path",
  required: true,
  description: desc,
  schema: { type: "string", format: "uuid" },
});
const consulta = (nombre: string, desc: string, schema: Obj = { type: "string" }) => ({
  name: nombre,
  in: "query",
  description: desc,
  schema,
});
const paginacionParams = [
  consulta("pagina", "Número de página (desde 1)", { type: "integer", minimum: 1, default: 1 }),
  consulta("limite", "Elementos por página", { type: "integer", minimum: 1, maximum: 100, default: 20 }),
];
const seguro = [{ bearerAuth: [] }];
const r401 = err("No autenticado");
const r403 = err("Sin permisos (se requiere rol ADMIN)");
const r404 = err("No encontrado");
const r400 = err("Datos inválidos");

// CRUD de catálogo: lectura para cualquier usuario autenticado, escritura solo ADMIN
function crud(
  tag: string,
  base: string,
  schema: string,
  schemaCrear: string,
  schemaActualizar: string,
  filtros: Obj[],
) {
  const etiqueta = [tag];
  return {
    [base]: {
      get: {
        tags: etiqueta,
        summary: `Listar ${tag.toLowerCase()}`,
        security: seguro,
        parameters: [...filtros, ...paginacionParams],
        responses: { 200: ok("Listado paginado", paginada(schema)), 400: r400, 401: r401 },
      },
      post: {
        tags: etiqueta,
        summary: `Crear (solo ADMIN)`,
        security: seguro,
        requestBody: cuerpo(schemaCrear),
        responses: { 201: ok("Creado", ref(schema)), 400: r400, 401: r401, 403: r403, 404: r404 },
      },
    },
    [`${base}/{id}`]: {
      get: {
        tags: etiqueta,
        summary: "Obtener por id",
        security: seguro,
        parameters: [idParam()],
        responses: { 200: ok("Encontrado", ref(schema)), 401: r401, 404: r404 },
      },
      patch: {
        tags: etiqueta,
        summary: "Actualizar (solo ADMIN)",
        security: seguro,
        parameters: [idParam()],
        requestBody: cuerpo(schemaActualizar),
        responses: { 200: ok("Actualizado", ref(schema)), 400: r400, 401: r401, 403: r403, 404: r404 },
      },
      delete: {
        tags: etiqueta,
        summary: "Eliminar (solo ADMIN)",
        security: seguro,
        parameters: [idParam()],
        responses: { 204: ok("Eliminado"), 401: r401, 403: r403, 404: r404 },
      },
    },
  };
}

const uuid = { type: "string", format: "uuid" };
const texto = (ejemplo: string) => ({ type: "string", example: ejemplo });

export const openapi = {
  openapi: "3.0.3",
  info: {
    title: "MusicAPI",
    version: "0.1.0",
    description:
      "API REST tipo Spotify: usuarios, catálogo, búsqueda, listas de reproducción, favoritos e historial. " +
      "Autenticación con JWT (acceso de corta vida + refresh token con rotación).",
  },
  servers: [{ url: "/api/v1" }],
  tags: [
    { name: "Auth" },
    { name: "Usuarios" },
    { name: "Artistas" },
    { name: "Álbumes" },
    { name: "Canciones" },
    { name: "Búsqueda" },
    { name: "Listas" },
    { name: "Favoritos" },
    { name: "Historial" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              codigo: texto("VALIDACION_FALLIDA"),
              mensaje: texto("Datos inválidos"),
              detalles: { description: "Opcional (por ejemplo, errores por campo)" },
            },
          },
        },
      },
      Paginacion: {
        type: "object",
        properties: {
          pagina: { type: "integer" },
          limite: { type: "integer" },
          total: { type: "integer" },
          totalPaginas: { type: "integer" },
        },
      },
      UsuarioPublico: {
        type: "object",
        properties: {
          id: uuid,
          correo: texto("ana@ejemplo.com"),
          nombreUsuario: texto("ana_01"),
          rol: { type: "string", enum: ["USUARIO", "ADMIN"] },
          creadoEn: { type: "string", format: "date-time" },
        },
      },
      Sesion: {
        type: "object",
        properties: {
          usuario: ref("UsuarioPublico"),
          tokenAcceso: { type: "string" },
          tokenRefresco: { type: "string" },
        },
      },
      Registro: {
        type: "object",
        required: ["correo", "nombreUsuario", "contrasena"],
        properties: {
          correo: texto("ana@ejemplo.com"),
          nombreUsuario: texto("ana_01"),
          contrasena: { type: "string", minLength: 8, maxLength: 72, example: "Secreta123" },
        },
      },
      InicioSesion: {
        type: "object",
        required: ["correo", "contrasena"],
        properties: { correo: texto("ana@ejemplo.com"), contrasena: texto("Secreta123") },
      },
      TokenRefresco: {
        type: "object",
        required: ["tokenRefresco"],
        properties: { tokenRefresco: { type: "string" } },
      },
      Artista: {
        type: "object",
        properties: {
          id: uuid,
          nombre: texto("Soda Stereo"),
          biografia: { type: "string", nullable: true },
        },
      },
      ArtistaCrear: {
        type: "object",
        required: ["nombre"],
        properties: { nombre: texto("Soda Stereo"), biografia: { type: "string", nullable: true } },
      },
      ArtistaActualizar: {
        type: "object",
        properties: { nombre: { type: "string" }, biografia: { type: "string", nullable: true } },
      },
      Album: {
        type: "object",
        properties: {
          id: uuid,
          titulo: texto("Canción Animal"),
          fechaLanzamiento: { type: "string", format: "date-time", nullable: true },
          artistaId: uuid,
          artista: { type: "object", properties: { id: uuid, nombre: { type: "string" } } },
        },
      },
      AlbumCrear: {
        type: "object",
        required: ["titulo", "artistaId"],
        properties: {
          titulo: texto("Canción Animal"),
          artistaId: uuid,
          fechaLanzamiento: { type: "string", format: "date", nullable: true, example: "1990-08-01" },
        },
      },
      AlbumActualizar: {
        type: "object",
        properties: {
          titulo: { type: "string" },
          fechaLanzamiento: { type: "string", format: "date", nullable: true },
        },
      },
      Cancion: {
        type: "object",
        properties: {
          id: uuid,
          titulo: texto("De música ligera"),
          duracionSeg: { type: "integer", example: 212 },
          artistaId: uuid,
          albumId: { ...uuid, nullable: true },
          artista: { type: "object", properties: { id: uuid, nombre: { type: "string" } } },
          album: {
            type: "object",
            nullable: true,
            properties: { id: uuid, titulo: { type: "string" } },
          },
        },
      },
      CancionCrear: {
        type: "object",
        required: ["titulo", "duracionSeg", "artistaId"],
        properties: {
          titulo: texto("De música ligera"),
          duracionSeg: { type: "integer", minimum: 1, maximum: 7200 },
          artistaId: uuid,
          albumId: { ...uuid, nullable: true },
        },
      },
      CancionActualizar: {
        type: "object",
        properties: {
          titulo: { type: "string" },
          duracionSeg: { type: "integer" },
          albumId: { ...uuid, nullable: true },
        },
      },
      ResultadoBusqueda: {
        type: "object",
        properties: {
          artistas: { type: "array", items: ref("Artista") },
          albumes: { type: "array", items: ref("Album") },
          canciones: { type: "array", items: ref("Cancion") },
        },
      },
      Lista: {
        type: "object",
        properties: {
          id: uuid,
          nombre: { type: "string" },
          esPublica: { type: "boolean" },
          propietarioId: uuid,
          creadoEn: { type: "string", format: "date-time" },
        },
      },
      ListaDetalle: {
        allOf: [
          ref("Lista"),
          {
            type: "object",
            properties: {
              canciones: {
                type: "array",
                items: {
                  allOf: [
                    ref("Cancion"),
                    {
                      type: "object",
                      properties: {
                        posicion: { type: "integer" },
                        agregadaEn: { type: "string", format: "date-time" },
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
      },
      ListaCrear: {
        type: "object",
        required: ["nombre"],
        properties: { nombre: texto("Para correr"), esPublica: { type: "boolean", default: false } },
      },
      ListaActualizar: {
        type: "object",
        properties: { nombre: { type: "string" }, esPublica: { type: "boolean" } },
      },
      AgregarCancion: {
        type: "object",
        required: ["cancionId"],
        properties: { cancionId: uuid },
      },
      EntradaHistorial: {
        type: "object",
        properties: {
          id: uuid,
          reproducidaEn: { type: "string", format: "date-time" },
          cancion: ref("Cancion"),
        },
      },
    },
  },
  paths: {
    "/auth/registro": {
      post: {
        tags: ["Auth"],
        summary: "Registrar usuario (rol USUARIO)",
        requestBody: cuerpo("Registro"),
        responses: { 201: ok("Creado", ref("Sesion")), 400: r400, 409: err("Correo o nombre de usuario ya registrado"), 429: err("Demasiados intentos") },
      },
    },
    "/auth/iniciar-sesion": {
      post: {
        tags: ["Auth"],
        summary: "Iniciar sesión",
        requestBody: cuerpo("InicioSesion"),
        responses: { 200: ok("Sesión iniciada", ref("Sesion")), 400: r400, 401: err("Credenciales inválidas"), 429: err("Demasiados intentos") },
      },
    },
    "/auth/refrescar": {
      post: {
        tags: ["Auth"],
        summary: "Rotar el refresh token y obtener nuevos tokens",
        requestBody: cuerpo("TokenRefresco"),
        responses: { 200: ok("Tokens nuevos", ref("Sesion")), 401: err("Token inválido, vencido o reutilizado") },
      },
    },
    "/auth/cerrar-sesion": {
      post: {
        tags: ["Auth"],
        summary: "Cerrar sesión (elimina el refresh token)",
        security: seguro,
        requestBody: cuerpo("TokenRefresco"),
        responses: { 204: ok("Sesión cerrada"), 401: r401 },
      },
    },
    "/usuarios/yo": {
      get: {
        tags: ["Usuarios"],
        summary: "Perfil del usuario autenticado",
        security: seguro,
        responses: { 200: ok("Perfil", ref("UsuarioPublico")), 401: r401 },
      },
    },
    ...crud("Artistas", "/artistas", "Artista", "ArtistaCrear", "ArtistaActualizar", [
      consulta("q", "Texto a buscar en el nombre"),
    ]),
    ...crud("Álbumes", "/albumes", "Album", "AlbumCrear", "AlbumActualizar", [
      consulta("q", "Texto a buscar en el título"),
      consulta("artistaId", "Filtrar por artista", uuid),
    ]),
    ...crud("Canciones", "/canciones", "Cancion", "CancionCrear", "CancionActualizar", [
      consulta("q", "Texto a buscar en el título"),
      consulta("artistaId", "Filtrar por artista", uuid),
      consulta("albumId", "Filtrar por álbum", uuid),
    ]),
    "/buscar": {
      get: {
        tags: ["Búsqueda"],
        summary: "Buscar en artistas, álbumes y canciones a la vez",
        security: seguro,
        parameters: [
          { ...consulta("q", "Texto a buscar (obligatorio)"), required: true },
          consulta("limite", "Máximo de resultados por tipo", { type: "integer", minimum: 1, maximum: 25, default: 10 }),
        ],
        responses: { 200: ok("Resultados", ref("ResultadoBusqueda")), 400: r400, 401: r401 },
      },
    },
    "/listas": {
      get: {
        tags: ["Listas"],
        summary: "Mis listas de reproducción",
        security: seguro,
        parameters: paginacionParams,
        responses: { 200: ok("Listado paginado", paginada("Lista")), 401: r401 },
      },
      post: {
        tags: ["Listas"],
        summary: "Crear lista de reproducción",
        security: seguro,
        requestBody: cuerpo("ListaCrear"),
        responses: { 201: ok("Creada", ref("Lista")), 400: r400, 401: r401 },
      },
    },
    "/listas/{id}": {
      get: {
        tags: ["Listas"],
        summary: "Ver una lista (propia o pública)",
        security: seguro,
        parameters: [idParam()],
        responses: { 200: ok("Lista con sus canciones", ref("ListaDetalle")), 401: r401, 404: r404 },
      },
      patch: {
        tags: ["Listas"],
        summary: "Editar lista (solo el propietario)",
        security: seguro,
        parameters: [idParam()],
        requestBody: cuerpo("ListaActualizar"),
        responses: { 200: ok("Actualizada", ref("Lista")), 400: r400, 401: r401, 403: err("No eres el propietario"), 404: r404 },
      },
      delete: {
        tags: ["Listas"],
        summary: "Eliminar lista (solo el propietario)",
        security: seguro,
        parameters: [idParam()],
        responses: { 204: ok("Eliminada"), 401: r401, 403: err("No eres el propietario"), 404: r404 },
      },
    },
    "/listas/{id}/canciones": {
      post: {
        tags: ["Listas"],
        summary: "Agregar una canción al final de la lista",
        security: seguro,
        parameters: [idParam()],
        requestBody: cuerpo("AgregarCancion"),
        responses: { 201: ok("Lista actualizada", ref("ListaDetalle")), 400: r400, 401: r401, 403: err("No eres el propietario"), 404: r404, 409: err("La canción ya está en la lista") },
      },
    },
    "/listas/{id}/canciones/{cancionId}": {
      delete: {
        tags: ["Listas"],
        summary: "Quitar una canción de la lista",
        security: seguro,
        parameters: [idParam(), idParam("cancionId", "Identificador de la canción")],
        responses: { 204: ok("Quitada"), 401: r401, 403: err("No eres el propietario"), 404: r404 },
      },
    },
    "/favoritos": {
      get: {
        tags: ["Favoritos"],
        summary: "Mis canciones favoritas",
        security: seguro,
        parameters: paginacionParams,
        responses: { 200: ok("Listado paginado", paginada("Cancion")), 401: r401 },
      },
    },
    "/favoritos/{id}": {
      put: {
        tags: ["Favoritos"],
        summary: "Marcar canción como favorita (idempotente)",
        security: seguro,
        parameters: [idParam("id", "Identificador de la canción")],
        responses: { 200: ok("Canción marcada", ref("Cancion")), 401: r401, 404: r404 },
      },
      delete: {
        tags: ["Favoritos"],
        summary: "Quitar canción de favoritos",
        security: seguro,
        parameters: [idParam("id", "Identificador de la canción")],
        responses: { 204: ok("Quitada"), 401: r401, 404: r404 },
      },
    },
    "/historial": {
      get: {
        tags: ["Historial"],
        summary: "Mi historial de reproducción (más reciente primero)",
        security: seguro,
        parameters: paginacionParams,
        responses: { 200: ok("Listado paginado", paginada("EntradaHistorial")), 401: r401 },
      },
      post: {
        tags: ["Historial"],
        summary: "Registrar una reproducción",
        security: seguro,
        requestBody: cuerpo("AgregarCancion"),
        responses: { 201: ok("Registrada"), 400: r400, 401: r401, 404: r404 },
      },
      delete: {
        tags: ["Historial"],
        summary: "Borrar todo mi historial",
        security: seguro,
        responses: { 204: ok("Historial borrado"), 401: r401 },
      },
    },
  },
};
