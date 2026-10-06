# MusicAPI

API REST análoga a Spotify, construida con **Node.js y TypeScript**: gestión de clientes (usuarios), catálogo musical, playlists y biblioteca personal, con autenticación mediante **JWT**. Toda la API (rutas, campos JSON, mensajes y códigos de error) está en español.

> **Estado:** Fases 1 a 5 completadas (autenticación, catálogo, búsqueda, listas, favoritos, historial, Swagger, Docker y CI). Ver [Fases del proyecto](#fases-del-proyecto).

---

## Tabla de contenido

1. [Stack tecnológico](#stack-tecnológico)
2. [Requisitos previos](#requisitos-previos)
3. [Instalación y puesta en marcha](#instalación-y-puesta-en-marcha)
4. [Scripts disponibles](#scripts-disponibles)
5. [Estructura del proyecto](#estructura-del-proyecto)
6. [Modelo de datos](#modelo-de-datos)
7. [Endpoints](#endpoints)
8. [Autenticación](#autenticación)
9. [Formato de errores](#formato-de-errores)
10. [Pruebas](#pruebas)
11. [Propuesta de mejores prácticas](#propuesta-de-mejores-prácticas)
12. [Fases del proyecto](#fases-del-proyecto)

---

## Stack tecnológico

| Área | Tecnología | Motivo |
|---|---|---|
| Runtime | Node.js >= 20 (LTS) | Versión estable con soporte a largo plazo |
| Lenguaje | TypeScript (modo `strict`) | Errores detectados al escribir, no en ejecución |
| Framework | Express 4 | Maduro, amplio ecosistema, fácil de mantener |
| Base de datos | PostgreSQL 16 | Datos muy relacionales (usuarios, playlists, canciones) |
| ORM | Prisma 5 | Esquema tipado, tipos generados automáticamente, migraciones versionadas |
| Autenticación | `jsonwebtoken` + `bcrypt` | Estándar JWT y hash seguro de contraseñas |
| Validación | Zod | Esquemas declarativos; los tipos se infieren con `z.infer` |
| Seguridad | Helmet, CORS, express-rate-limit | Cabeceras seguras y protección contra abuso |
| Logs | Pino | Logs JSON estructurados y de bajo costo |
| Pruebas | Vitest + Supertest | Unitarias e integración HTTP con soporte nativo de TypeScript |
| Lint | ESLint + typescript-eslint | Estilo consistente y reglas específicas de TypeScript |
| Desarrollo | tsx | Ejecuta TypeScript directo con recarga automática |
| Entorno | Docker Compose | Base de datos reproducible en cualquier máquina |

---

## Requisitos previos

- [Node.js](https://nodejs.org/) 20 o superior (`node -v`)
- npm 10 o superior (`npm -v`)
- [Docker Desktop](https://www.docker.com/) (para PostgreSQL)
- Git

---

## Instalación y puesta en marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Variables de entorno (en PowerShell: Copy-Item .env.example .env)
cp .env.example .env
#    Edita .env y reemplaza los secretos JWT (ver abajo)

# 3. Levantar PostgreSQL (--wait espera a que esté listo)
docker compose up -d --wait

# 4. Generar el cliente de Prisma (genera los tipos de TypeScript)
npm run prisma:generate

# 5. Crear las tablas (primera migración)
npx prisma migrate dev --name init

# 6. Iniciar en modo desarrollo
npm run dev
```

Verifica que funciona (desde **otra terminal**, mientras `npm run dev` sigue corriendo):

```bash
curl http://localhost:3000/health
# PowerShell: Invoke-RestMethod http://localhost:3000/health
```

> **Notas para Windows**
> - La base de datos se publica en `127.0.0.1:5433` (no en el 5432) para no chocar con un PostgreSQL local. Usa `127.0.0.1` y no `localhost` en `DATABASE_URL`: Prisma no reintenta por IPv4 si `localhost` resuelve primero a IPv6.
> - Usa `npx prisma migrate dev --name init` en lugar de `npm run prisma:migrate -- --name init`: PowerShell puede perder el argumento `--name` al pasarlo por npm.
> - `npm run dev` ocupa la terminal; las pruebas con `curl` o `Invoke-RestMethod` se hacen desde otra.

### Generar secretos JWT seguros

Usa un valor distinto para cada secreto:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Variables de entorno

| Variable | Descripción | Por defecto |
|---|---|---|
| `NODE_ENV` | `development`, `test` o `production` | `development` |
| `PORT` | Puerto HTTP | `3000` |
| `DATABASE_URL` | Cadena de conexión a PostgreSQL | — |
| `JWT_ACCESS_SECRET` | Secreto del access token (mín. 16 caracteres) | — |
| `JWT_REFRESH_SECRET` | Secreto del refresh token (mín. 16 caracteres) | — |
| `JWT_ACCESS_EXPIRES` | Vida del access token | `15m` |
| `JWT_REFRESH_EXPIRES_DAYS` | Vida del refresh token en días | `7` |
| `BCRYPT_ROUNDS` | Costo del hash de contraseñas | `12` |
| `CORS_ORIGIN` | Orígenes permitidos, separados por coma | `http://localhost:5173` |

Valor de ejemplo para `DATABASE_URL`:

```dotenv
DATABASE_URL="postgresql://music:music@127.0.0.1:5433/musicapi?schema=public"
```

La aplicación **valida estas variables al arrancar** y se detiene con un mensaje claro si falta alguna.

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor con recarga automática (tsx watch) |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta la versión compilada (producción) |
| `npm run typecheck` | Verifica tipos sin generar archivos |
| `npm test` | Ejecuta las pruebas con Vitest |
| `npm run test:watch` | Pruebas en modo observación |
| `npm run lint` | Revisa el código con ESLint |
| `npm run prisma:generate` | Genera el cliente y los tipos de Prisma |
| `npm run prisma:migrate` | Crea y aplica migraciones en desarrollo |
| `npm run prisma:deploy` | Aplica migraciones en producción |
| `npm run prisma:studio` | Interfaz visual de la base de datos |
| `npm run seed` | Crea el administrador inicial (y, opcionalmente, datos de ejemplo) |

---

## Estructura del proyecto

```
musicapi/
├── prisma/
│   ├── schema.prisma            # Modelo de datos
│   └── migrations/              # Migraciones versionadas
├── src/
│   ├── config/                  # env, logger, cliente Prisma, mensajes Zod en español
│   ├── middlewares/
│   │   ├── autenticacion.ts     # autenticar, requerirRol, usuarioActual
│   │   ├── errorHandler.ts      # noEncontrado, manejadorErrores
│   │   ├── limitadores.ts       # rate limiting
│   │   └── validate.ts          # validar() con Zod
│   ├── modules/                 # un directorio por dominio
│   │   ├── auth/                # registro, inicio de sesión, refresco, cierre de sesión
│   │   │   ├── auth.rutas.ts
│   │   │   ├── auth.controlador.ts
│   │   │   ├── auth.servicio.ts
│   │   │   ├── auth.repositorio.ts
│   │   │   ├── auth.esquemas.ts
│   │   │   └── tokens.ts        # firma y verificación de JWT, hash de tokens
│   │   ├── usuarios/            # perfil del usuario autenticado
│   │   ├── artistas/            # CRUD (lectura autenticada, escritura ADMIN)
│   │   ├── albumes/
│   │   ├── canciones/
│   │   ├── busqueda/            # búsqueda combinada
│   │   ├── listas/              # listas de reproducción y sus canciones
│   │   ├── favoritos/
│   │   └── historial/
│   ├── types/                   # extensión de tipos de Express (req.usuario)
│   ├── utils/                   # AppError, asyncHandler, paginación
│   ├── scripts/seed.ts          # semilla: administrador y datos demo
│   ├── docs/                    # Especificación OpenAPI y Swagger UI
│   ├── app.ts                   # Configuración de Express
│   └── server.ts                # Arranque y cierre ordenado
├── tests/
│   └── helpers/bd-falsa.ts      # BD en memoria para pruebas sin PostgreSQL
├── Dockerfile
├── docker-compose.yml
├── .github/workflows/ci.yml
├── tsconfig.json
├── tsconfig.build.json
├── vitest.config.mts
├── eslint.config.mjs
├── .env.example
└── package.json
```

Cada módulo sigue la arquitectura por capas:

```
rutas → controlador → servicio → repositorio (Prisma)
```

- **rutas:** define URL, middlewares y esquema de validación.
- **controlador:** traduce HTTP a llamadas al servicio (sin lógica de negocio).
- **servicio:** reglas de negocio.
- **repositorio:** único punto de acceso a la base de datos.

---

## Modelo de datos

```
Usuario ──< TokenRefresco
Usuario ──< ListaReproduccion >──< Cancion (vía ListaCancion, con posición)
Usuario ──< Favorito >── Cancion
Usuario ──< HistorialReproduccion >── Cancion
Artista ──< Album ──< Cancion
Artista ──< Cancion
```

Tablas: `usuarios`, `tokens_refresco`, `artistas`, `albumes`, `canciones`, `listas_reproduccion`, `lista_canciones`, `favoritos`, `historial_reproduccion`. El esquema completo está en [`prisma/schema.prisma`](prisma/schema.prisma).

**Convención de nombres:** modelos en español, singular y PascalCase (`ListaReproduccion`); tablas en plural y snake_case (`listas_reproduccion`); campos en camelCase en el código y snake_case en la base de datos mediante `@map`. Sin tildes ni `ñ`.

---

## Endpoints

Todos bajo el prefijo `/api/v1` (excepto `/health`).

| Módulo | Método y ruta | Acceso |
|---|---|---|
| Auth | `POST /auth/registro` | Público |
| Auth | `POST /auth/iniciar-sesion` | Público |
| Auth | `POST /auth/refrescar` | Público (con token de refresco) |
| Auth | `POST /auth/cerrar-sesion` | Autenticado |
| Usuarios | `GET /usuarios/yo` | Autenticado |
| Catálogo | `GET /artistas`, `/albumes`, `/canciones` (+ `/:id`) | Autenticado |
| Catálogo | `POST`, `PATCH /:id`, `DELETE /:id` sobre los anteriores | Solo `ADMIN` |
| Búsqueda | `GET /buscar?q=` (artistas, álbumes y canciones a la vez) | Autenticado |
| Listas | `GET/POST /listas`, `GET/PATCH/DELETE /listas/:id` | Dueño (una lista pública es de solo lectura para otros) |
| Listas | `POST /listas/:id/canciones`, `DELETE /listas/:id/canciones/:cancionId` | Dueño |
| Favoritos | `GET /favoritos`, `PUT/DELETE /favoritos/:cancionId` | Autenticado (solo los propios) |
| Historial | `GET/POST/DELETE /historial` | Autenticado (solo el propio) |
| Documentación | `GET /api-docs` (Swagger UI), `GET /api-docs.yaml` | Público; desactivada en producción |
| Sistema | `GET /health` | Público |

**Listados:** aceptan `?pagina=1&limite=20` (máximo 100) y responden `{ datos, paginacion: { pagina, limite, total, totalPaginas } }`. Los de catálogo aceptan además `q` (texto) y filtros por `artistaId` / `albumId`.

**Privacidad de listas:** una lista privada de otro usuario responde `404` (no se revela que existe); una pública responde `403` si se intenta modificar.

### Administrador inicial (seed)

El registro público siempre crea usuarios `USUARIO`. Para tener un `ADMIN`, define `ADMIN_CORREO`, `ADMIN_NOMBRE_USUARIO` y `ADMIN_CONTRASENA` en `.env` (ver `.env.example`) y ejecuta:

```bash
npm run seed
```

Es idempotente: si el usuario ya existe solo se asegura su rol `ADMIN`, sin cambiar su contraseña. Con `SEED_DATOS_DEMO=true` crea además un artista, un álbum y tres canciones de ejemplo (ignorado en producción).

### Documentación interactiva

Con el servidor en marcha: <http://localhost:3000/api-docs>. Para probar rutas protegidas, inicia sesión, copia el `tokenAcceso` y pulsa **Authorize**.

---

## Autenticación

### Flujo

1. `POST /auth/registro` o `POST /auth/iniciar-sesion` devuelven `tokenAcceso` (vida corta) y `tokenRefresco` (vida larga).
2. Las rutas protegidas exigen la cabecera `Authorization: Bearer <tokenAcceso>`.
3. Cuando el token de acceso expira, `POST /auth/refrescar` con el `tokenRefresco` entrega un par nuevo. **El token de refresco usado deja de ser válido** (rotación).
4. `POST /auth/cerrar-sesion` elimina el token de refresco indicado; las demás sesiones del usuario no se ven afectadas.

| Token | Vida | Secreto | Almacenamiento |
|---|---|---|---|
| Acceso | 15 min | `JWT_ACCESS_SECRET` | No se guarda (se verifica la firma) |
| Refresco | 7 días | `JWT_REFRESH_SECRET` | Solo su hash SHA-256 en `tokens_refresco` |

### Ejemplos (PowerShell)

```powershell
$base = "http://localhost:3000/api/v1"
$cuerpo = @{ correo = "ana@ejemplo.com"; nombreUsuario = "ana_01"; contrasena = "Secreta123" } | ConvertTo-Json

# Registro
$sesion = Invoke-RestMethod -Method Post -Uri "$base/auth/registro" -ContentType "application/json" -Body $cuerpo

# Ruta protegida
Invoke-RestMethod "$base/usuarios/yo" -Headers @{ Authorization = "Bearer $($sesion.tokenAcceso)" }

# Refrescar tokens
Invoke-RestMethod -Method Post -Uri "$base/auth/refrescar" -ContentType "application/json" `
  -Body (@{ tokenRefresco = $sesion.tokenRefresco } | ConvertTo-Json)
```

### Requisitos de los datos

| Campo | Regla |
|---|---|
| `correo` | Correo válido, máx. 254 caracteres; se guarda en minúsculas |
| `nombreUsuario` | 3 a 30 caracteres: letras, números y guion bajo |
| `contrasena` | Mín. 8 caracteres, máx. 72 bytes, al menos una letra y un número |

Los cuerpos con campos desconocidos (por ejemplo `rol`) se rechazan con `400`.

### Roles

`USUARIO` (por defecto) y `ADMIN`. Los endpoints restringidos usan el middleware `requerirRol('ADMIN')`. El rol viaja dentro del token de acceso, por lo que un cambio de rol se aplica como máximo tras 15 minutos (al refrescar el token).

---

## Formato de errores

Todos los errores tienen la misma forma:

```json
{
  "error": {
    "codigo": "VALIDACION_FALLIDA",
    "mensaje": "Datos inválidos",
    "detalles": { "correo": ["Correo electrónico inválido"] }
  }
}
```

| Código HTTP | `codigo` | Cuándo |
|---|---|---|
| 400 | `VALIDACION_FALLIDA` | Datos inválidos o campos no permitidos |
| 400 | `JSON_INVALIDO` | El cuerpo no es un JSON válido |
| 401 | `NO_AUTENTICADO` | Falta el token de acceso |
| 401 | `TOKEN_INVALIDO` / `TOKEN_EXPIRADO` | Token mal formado, con firma incorrecta o vencido |
| 401 | `TOKEN_REUTILIZADO` | Se reutilizó un token de refresco ya rotado; se cierran todas las sesiones |
| 401 | `CREDENCIALES_INVALIDAS` | Correo o contraseña incorrectos |
| 403 | `PROHIBIDO` | El rol no tiene permiso |
| 404 | `NO_ENCONTRADO` / `USUARIO_NO_ENCONTRADO` | Ruta o recurso inexistente |
| 400 | `ALBUM_NO_COINCIDE` | El álbum no pertenece al artista de la canción |
| 404 | `ARTISTA_NO_ENCONTRADO` / `ALBUM_NO_ENCONTRADO` / `CANCION_NO_ENCONTRADA` / `LISTA_NO_ENCONTRADA` | Recurso inexistente (o lista privada ajena) |
| 404 | `CANCION_NO_EN_LISTA` / `FAVORITO_NO_ENCONTRADO` | Se intenta quitar algo que no estaba |
| 409 | `USUARIO_EXISTENTE` | Correo o nombre de usuario ya registrados |
| 409 | `CANCION_DUPLICADA` | La canción ya está en la lista |
| 409 | `CONFLICTO` | Respaldo ante condiciones de carrera en la base de datos |
| 413 | `CUERPO_DEMASIADO_GRANDE` | El cuerpo supera 100 kb |
| 429 | `DEMASIADAS_PETICIONES` | Límite de peticiones excedido |
| 500 | `ERROR_INTERNO` | Error no controlado (sin detalles internos) |

---

## Pruebas

```bash
npm test
```

Las pruebas se ejecutan **sin PostgreSQL**: los repositorios se sustituyen por una base de datos en memoria (`tests/helpers/bd-falsa.ts`) que imita su comportamiento, de modo que se prueba la lógica real de servicios, rutas, validación y JWT. Cubren, entre otros casos:

- Registro, inicio de sesión y perfil.
- Hash de contraseñas y de refresh tokens en la base de datos.
- Rechazo de `rol` al registrarse.
- Misma respuesta ante correo inexistente y contraseña incorrecta.
- Rotación y detección de reutilización de refresh tokens.
- Tokens con firma falsa, expirados, con algoritmo `none` o de tipo equivocado.
- Control de acceso por rol y límite de peticiones.
- Catálogo: solo `ADMIN` escribe, validación estricta, 404 y coherencia álbum/artista.
- Búsqueda y paginación (con tope de 100).
- Listas: privadas ajenas ocultas (404), públicas ajenas de solo lectura (403), canciones duplicadas (409).
- Favoritos e historial siempre ligados al usuario del token.
- La especificación OpenAPI y Swagger UI se sirven correctamente.

---

## Docker e integración continua

**Imagen de la API** (multi-etapa, usuario sin privilegios, `HEALTHCHECK` sobre `/health`):

```bash
docker build -t musicapi .
docker run --rm -p 3000:3000 --env-file .env -e NODE_ENV=production -e DATABASE_URL="postgresql://music:music@host.docker.internal:5433/musicapi?schema=public" musicapi
```

Las migraciones no se aplican al arrancar; en despliegue se ejecuta `npx prisma migrate deploy` como paso aparte.

**CI** (`.github/workflows/ci.yml`, GitHub Actions): en cada push y pull request ejecuta `typecheck`, `lint`, pruebas, `build` y `npm audit --omit=dev` (falla con vulnerabilidades altas), y comprueba que la imagen Docker se construye.

---

## Propuesta de mejores prácticas

Esta sección resume las decisiones de diseño que guían el desarrollo y por qué se toman.

### 1. Seguridad

| Práctica | Detalle y justificación |
|---|---|
| **Access token corto** | Vida de 15 min. Si se filtra, la ventana de abuso es mínima. |
| **Refresh token con rotación** | Cada uso del refresh emite uno nuevo e invalida el anterior, dentro de una transacción atómica. Si se reutiliza uno ya revocado, se detecta posible robo y se revocan todos los tokens del usuario. |
| **Refresh token hasheado en BD** | Se guarda solo el hash (SHA-256). Una filtración de la base de datos no expone tokens utilizables. |
| **Secretos distintos por tipo de token** | Access y refresh se firman con secretos diferentes; además cada token lleva un claim `tipo` que se verifica, así uno no puede usarse en lugar del otro. |
| **JWT con algoritmo fijado** | Solo se aceptan tokens `HS256` de emisor `musicapi`; se rechazan tokens sin firma (`alg: none`) y firmados con otro algoritmo. |
| **Contraseñas con bcrypt** | Costo configurable (12 por defecto). Nunca se almacena ni se registra la contraseña en claro. |
| **Política de contraseñas** | Mínimo 8 caracteres, al menos una letra y un número, y máximo 72 bytes (límite real de bcrypt). |
| **Mensajes de login genéricos y tiempo uniforme** | "Credenciales inválidas" sin distinguir si falló el correo o la contraseña; además se compara contra un hash de relleno cuando el correo no existe, para que el tiempo de respuesta no delate qué correos están registrados. |
| **Validación estricta (anti mass-assignment)** | Los esquemas rechazan campos desconocidos: no es posible enviar `rol: ADMIN` al registrarse. El rol nunca se lee de la entrada del cliente. |
| **Rate limiting** | 10 intentos cada 15 minutos por IP en registro e inicio de sesión (contra fuerza bruta); 100 por minuto en el resto de la API. |
| **Helmet y CORS restringido** | Cabeceras HTTP seguras y solo los orígenes autorizados. |
| **Autorización por roles y propiedad** | Rol `ADMIN` para el catálogo; verificación de dueño en playlists. Se valida siempre en el servidor, nunca se confía en el cliente. |
| **Secretos en variables de entorno** | Nada sensible en el código ni en Git (`.env` está en `.gitignore`). |
| **Base de datos no expuesta a la red** | El puerto de PostgreSQL se publica solo en `127.0.0.1`; ningún otro equipo puede alcanzarlo aunque conozca las credenciales. |
| **Logs sin datos sensibles** | Las peticiones solo registran método, URL y estado; `password` y `refreshToken` se redactan. |
| **Errores sin filtración interna** | Los errores no controlados responden un mensaje genérico (`ERROR_INTERNO`); el detalle solo queda en el log del servidor. |
| **Límite de tamaño del body** | `100kb` para mitigar peticiones abusivas. |

### 2. Diseño de la API

| Práctica | Detalle y justificación |
|---|---|
| **REST versionada** | Prefijo `/api/v1` para evolucionar sin romper clientes existentes. |
| **API en español** | Rutas, campos JSON, mensajes y códigos de error en español, coherentes con la base de datos y el código. Solo los términos técnicos estándar (`JWT`, `token`, `/health`) se mantienen. |
| **Recursos en plural y verbos HTTP correctos** | `GET` lee, `POST` crea, `PUT/PATCH` modifica, `DELETE` elimina. |
| **Códigos HTTP precisos** | `201` al crear, `204` sin contenido, `400` validación, `401` sin autenticar, `403` sin permiso, `404`, `409` conflicto, `413` cuerpo grande, `429` límite excedido. |
| **Formato de error estándar** | Siempre `{ "error": { "codigo", "mensaje", "detalles" } }`, de modo que el cliente maneja errores de forma uniforme. |
| **Paginación obligatoria** | Todos los listados aceptan `?page=&limit=` con un máximo, y responden con metadatos (`total`, `page`, `limit`). |
| **Validación en el borde** | Cada endpoint valida `body`, `query` y `params` con Zod antes de llegar al controlador, con mensajes en español. |
| **Idempotencia** | `PUT/DELETE` de favoritos y de canciones en playlist, y el cierre de sesión, se pueden repetir sin efectos secundarios. |
| **Documentación OpenAPI** | Swagger UI en `/docs`, siempre alineada con el código. |

### 3. Arquitectura y código

| Práctica | Detalle y justificación |
|---|---|
| **TypeScript en modo `strict`** | Tipado estático que previene errores comunes (valores nulos, campos mal escritos, roles mal comparados). |
| **Tipos derivados, no duplicados** | Los tipos de la base de datos los genera Prisma y los de entrada se infieren del esquema Zod (`z.infer`): una sola fuente de verdad. |
| **Sin `any`** | ESLint con `typescript-eslint` penaliza el uso de `any` para no perder las garantías del tipado. |
| **Capas separadas** | Controladores sin lógica de negocio y servicios sin conocimiento de HTTP: más fáciles de probar y de cambiar. |
| **Repositorios aislados** | Todo acceso a la base de datos vive en un repositorio por módulo; permite probar la lógica con una base en memoria. |
| **Organización por módulos de dominio** | Todo lo de "playlists" vive junto; el proyecto escala sin volverse un caos de carpetas por tipo. |
| **Manejo de errores centralizado** | Un único manejador y una clase `AppError`; los servicios lanzan errores de dominio, no respuestas HTTP. Un envoltorio `asyncHandler` evita que fallen en silencio los errores de funciones `async` en Express 4. |
| **Configuración validada y tipada al inicio** | Falla rápido si el entorno está mal configurado (*fail fast*) y expone un objeto `env` tipado. |
| **Cierre ordenado** | Se atienden `SIGTERM`/`SIGINT` para terminar peticiones en curso antes de salir. |

### 4. Datos

| Práctica | Detalle y justificación |
|---|---|
| **Migraciones versionadas** | Todo cambio de esquema queda en Git y es reproducible en cualquier entorno. |
| **Índices en columnas de búsqueda y de unión** | `titulo`, `nombre`, `artistaId`, `propietarioId`, `(usuarioId, reproducidaEn)` para evitar escaneos completos. |
| **UUID como identificadores** | No expone cantidad de registros ni permite adivinar IDs consecutivos. |
| **Borrado en cascada controlado** | Relaciones definidas explícitamente (`Cascade` / `SetNull`) para mantener integridad. |
| **Operaciones críticas atómicas** | La rotación de refresh tokens usa una transacción con actualización condicional, lo que evita condiciones de carrera entre peticiones simultáneas. |
| **Prevención de N+1** | Uso de `include`/`select` de Prisma para cargar relaciones en una sola consulta. |
| **Convención de nombres consistente** | Dominio en español, tablas en plural y snake_case, campos mapeados con `@map`. El código se lee con el vocabulario del negocio y la BD sigue el estándar SQL. |

### 5. Calidad y operación

| Práctica | Detalle y justificación |
|---|---|
| **Pruebas unitarias y de integración** | Servicios y rutas con Vitest y Supertest; casos de seguridad incluidos (tokens falsos, reutilización, escalada de rol). |
| **Chequeo de tipos y lint automatizados** | `npm run typecheck` y `npm run lint` antes de cada entrega. |
| **Integración continua** | Pipeline que ejecuta typecheck, lint y tests en cada push (propuesto para Fase 5). |
| **Compilación separada para producción** | Se ejecuta el JavaScript compilado de `dist/`, sin herramientas de desarrollo. |
| **Logs estructurados** | JSON con Pino, con ID de petición para trazabilidad. |
| **Endpoint `/health`** | Para monitoreo y *health checks* de contenedores. |
| **Contenedorización** | Docker para que el entorno sea idéntico en desarrollo y producción. |
| **Dependencias auditadas** | `npm audit` periódico y versiones fijadas con `package-lock.json`. |

### 6. Mejoras futuras (fuera del MVP)

- Limpieza periódica de refresh tokens vencidos.
- Caché con Redis para búsquedas y catálogo.
- Subida y streaming de audio con almacenamiento de objetos (S3 o similar).
- Recomendaciones basadas en el historial de reproducción.
- Verificación de email y recuperación de contraseña.
- Autenticación de dos factores.
- Métricas con Prometheus/Grafana.

---

## Fases del proyecto

- [x] **Fase 1:** Setup del proyecto en TypeScript, estructura, esquema de BD en español, Docker, configuración, manejo de errores, pruebas base
- [x] **Fase 2:** Autenticación con JWT y refresh tokens (registro, inicio de sesión, rotación, cierre de sesión, roles)
- [x] **Fase 3:** Catálogo (artistas, álbumes, canciones), búsqueda y script de semilla para el administrador
- [x] **Fase 4:** Playlists y biblioteca (favoritos e historial)
- [x] **Fase 5:** Documentación Swagger, pruebas completas, Dockerfile y CI

---

## Licencia

Proyecto académico. Uso libre con fines educativos.