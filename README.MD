# MusicAPI

API REST análoga a Spotify, construida con **Node.js y TypeScript**: gestión de clientes (usuarios), catálogo musical, playlists y biblioteca personal, con autenticación mediante **JWT**.

> **Estado:** Fase 1 completada (setup del proyecto). Ver [Fases del proyecto](#fases-del-proyecto).

---

## Tabla de contenido

1. [Stack tecnológico](#stack-tecnológico)
2. [Requisitos previos](#requisitos-previos)
3. [Instalación y puesta en marcha](#instalación-y-puesta-en-marcha)
4. [Scripts disponibles](#scripts-disponibles)
5. [Estructura del proyecto](#estructura-del-proyecto)
6. [Modelo de datos](#modelo-de-datos)
7. [Endpoints planificados](#endpoints-planificados)
8. [Propuesta de mejores prácticas](#propuesta-de-mejores-prácticas)
9. [Fases del proyecto](#fases-del-proyecto)

---

## Stack tecnológico

| Área          | Tecnología                       | Motivo                                                                   |
| ------------- | -------------------------------- | ------------------------------------------------------------------------ |
| Runtime       | Node.js >= 20 (LTS)              | Versión estable con soporte a largo plazo                                |
| Lenguaje      | TypeScript (modo `strict`)       | Errores detectados al escribir, no en ejecución                          |
| Framework     | Express 4                        | Maduro, amplio ecosistema, fácil de mantener                             |
| Base de datos | PostgreSQL 16                    | Datos muy relacionales (usuarios, playlists, canciones)                  |
| ORM           | Prisma 5                         | Esquema tipado, tipos generados automáticamente, migraciones versionadas |
| Autenticación | `jsonwebtoken` + `bcrypt`        | Estándar JWT y hash seguro de contraseñas                                |
| Validación    | Zod                              | Esquemas declarativos; los tipos se infieren con `z.infer`               |
| Seguridad     | Helmet, CORS, express-rate-limit | Cabeceras seguras y protección contra abuso                              |
| Logs          | Pino                             | Logs JSON estructurados y de bajo costo                                  |
| Pruebas       | Vitest + Supertest               | Unitarias e integración HTTP con soporte nativo de TypeScript            |
| Lint          | ESLint + typescript-eslint       | Estilo consistente y reglas específicas de TypeScript                    |
| Desarrollo    | tsx                              | Ejecuta TypeScript directo con recarga automática                        |
| Entorno       | Docker Compose                   | Base de datos reproducible en cualquier máquina                          |

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

> **Notas para Windows**
>
> - La base de datos se publica en `127.0.0.1:5433` (no en el 5432) para no chocar con un PostgreSQL local. Usa `127.0.0.1` y no `localhost` en `DATABASE_URL`: Prisma no reintenta por IPv4 si `localhost` resuelve primero a IPv6.
> - Usa `npx prisma migrate dev --name init` en lugar de `npm run prisma:migrate -- --name init`: PowerShell puede perder el argumento `--name` al pasarlo por npm.
> - `npm run dev` ocupa la terminal; las pruebas con `curl` o `Invoke-RestMethod` se hacen desde otra.

Verifica que funciona:

```bash
curl http://localhost:3000/health
# PowerShell: Invoke-RestMethod http://localhost:3000/health
```

### Generar secretos JWT seguros

Usa un valor distinto para cada secreto:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Variables de entorno

| Variable                   | Descripción                                    | Por defecto             |
| -------------------------- | ---------------------------------------------- | ----------------------- |
| `NODE_ENV`                 | `development`, `test` o `production`           | `development`           |
| `PORT`                     | Puerto HTTP                                    | `3000`                  |
| `DATABASE_URL`             | Cadena de conexión a PostgreSQL                | —                       |
| `JWT_ACCESS_SECRET`        | Secreto del access token (mín. 16 caracteres)  | —                       |
| `JWT_REFRESH_SECRET`       | Secreto del refresh token (mín. 16 caracteres) | —                       |
| `JWT_ACCESS_EXPIRES`       | Vida del access token                          | `15m`                   |
| `JWT_REFRESH_EXPIRES_DAYS` | Vida del refresh token en días                 | `7`                     |
| `BCRYPT_ROUNDS`            | Costo del hash de contraseñas                  | `12`                    |
| `CORS_ORIGIN`              | Orígenes permitidos, separados por coma        | `http://localhost:5173` |

La aplicación **valida estas variables al arrancar** y se detiene con un mensaje claro si falta alguna.

---

## Scripts disponibles

| Comando                   | Descripción                                 |
| ------------------------- | ------------------------------------------- |
| `npm run dev`             | Servidor con recarga automática (tsx watch) |
| `npm run build`           | Compila TypeScript a `dist/`                |
| `npm start`               | Ejecuta la versión compilada (producción)   |
| `npm run typecheck`       | Verifica tipos sin generar archivos         |
| `npm test`                | Ejecuta las pruebas con Vitest              |
| `npm run test:watch`      | Pruebas en modo observación                 |
| `npm run lint`            | Revisa el código con ESLint                 |
| `npm run prisma:generate` | Genera el cliente y los tipos de Prisma     |
| `npm run prisma:migrate`  | Crea y aplica migraciones en desarrollo     |
| `npm run prisma:deploy`   | Aplica migraciones en producción            |
| `npm run prisma:studio`   | Interfaz visual de la base de datos         |

---

## Estructura del proyecto

```
musicapi/
├── prisma/
│   └── schema.prisma        # Modelo de datos
├── src/
│   ├── config/              # env, logger, cliente Prisma
│   ├── middlewares/         # errorHandler, validate (auth y roles en Fase 2)
│   ├── modules/             # un directorio por dominio
│   │   ├── auth/
│   │   ├── users/
│   │   ├── tracks/
│   │   └── playlists/
│   ├── utils/               # AppError y utilidades
│   ├── docs/                # Especificación OpenAPI (Fase 5)
│   ├── app.ts               # Configuración de Express
│   └── server.ts            # Arranque y cierre ordenado
├── tests/
├── docker-compose.yml
├── tsconfig.json
├── tsconfig.build.json
├── vitest.config.mts
├── eslint.config.mjs
├── .env.example
└── package.json
```

Cada módulo seguirá la arquitectura por capas:

```
routes → controller → service → repository (Prisma)
```

- **routes:** define URL, middlewares y esquema de validación.
- **controller:** traduce HTTP a llamadas al servicio (sin lógica de negocio).
- **service:** reglas de negocio.
- **repository:** único punto de acceso a la base de datos.

---

## Modelo de datos

```
User ──< RefreshToken
User ──< Playlist >──< Track (vía PlaylistTrack, con posición)
User ──< Favorite >── Track
User ──< PlayHistory >── Track
Artist ──< Album ──< Track
Artist ──< Track
```

Entidades: `User`, `RefreshToken`, `Artist`, `Album`, `Track`, `Playlist`, `PlaylistTrack`, `Favorite`, `PlayHistory`. El esquema completo está en [`prisma/schema.prisma`](prisma/schema.prisma).

---

## Endpoints planificados

Todos bajo el prefijo `/api/v1`.

| Módulo     | Método y ruta                                                         | Acceso                         |
| ---------- | --------------------------------------------------------------------- | ------------------------------ |
| Auth       | `POST /auth/register`                                                 | Público                        |
| Auth       | `POST /auth/login`                                                    | Público                        |
| Auth       | `POST /auth/refresh`                                                  | Público (refresh token)        |
| Auth       | `POST /auth/logout`                                                   | Autenticado                    |
| Usuarios   | `GET /users/me`, `PATCH /users/me`                                    | Autenticado                    |
| Catálogo   | `GET /artists`, `/albums`, `/tracks` (+ `/:id`)                       | Autenticado                    |
| Catálogo   | `POST`, `PATCH`, `DELETE` sobre los anteriores                        | Solo `ADMIN`                   |
| Búsqueda   | `GET /search?q=&type=track\|artist\|album`                            | Autenticado                    |
| Playlists  | `GET/POST /playlists`, `GET/PATCH/DELETE /playlists/:id`              | Dueño (o pública solo lectura) |
| Playlists  | `POST /playlists/:id/tracks`, `DELETE /playlists/:id/tracks/:trackId` | Dueño                          |
| Biblioteca | `GET /me/favorites`, `PUT/DELETE /me/favorites/:trackId`              | Autenticado                    |
| Biblioteca | `GET /me/history`, `POST /me/history`                                 | Autenticado                    |
| Sistema    | `GET /health`                                                         | Público                        |

---

## Propuesta de mejores prácticas

Esta sección resume las decisiones de diseño que guían el desarrollo y por qué se toman.

### 1. Seguridad

| Práctica                                 | Detalle y justificación                                                                                                                                  |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Access token corto**                   | Vida de 15 min. Si se filtra, la ventana de abuso es mínima.                                                                                             |
| **Refresh token con rotación**           | Cada uso del refresh emite uno nuevo e invalida el anterior. Si se reutiliza uno ya revocado, se detecta robo y se revocan todos los tokens del usuario. |
| **Refresh token hasheado en BD**         | Se guarda solo el hash (SHA-256). Una filtración de la base de datos no expone tokens utilizables.                                                       |
| **Secretos distintos por tipo de token** | Access y refresh se firman con secretos diferentes; un token no puede usarse en lugar del otro.                                                          |
| **Contraseñas con bcrypt**               | Costo configurable (12 por defecto). Nunca se almacena ni se registra la contraseña en claro.                                                            |
| **Mensajes de login genéricos**          | "Credenciales inválidas" sin distinguir si falló el email o la contraseña, para evitar enumeración de usuarios.                                          |
| **Rate limiting**                        | Límite estricto en `/auth/login` y `/auth/register` contra fuerza bruta; límite general más holgado en el resto.                                         |
| **Helmet y CORS restringido**            | Cabeceras HTTP seguras y solo los orígenes autorizados.                                                                                                  |
| **Autorización por roles y propiedad**   | Rol `ADMIN` para el catálogo; verificación de dueño en playlists. Se valida siempre en el servidor, nunca se confía en el cliente.                       |
| **Secretos en variables de entorno**     | Nada sensible en el código ni en Git (`.env` está en `.gitignore`).                                                                                      |
| **Logs sin datos sensibles**             | Las peticiones solo registran método, URL y estado; `password` y `refreshToken` se redactan.                                                             |
| **Límite de tamaño del body**            | `100kb` para mitigar peticiones abusivas.                                                                                                                |

### 2. Diseño de la API

| Práctica                                       | Detalle y justificación                                                                                                                        |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **REST versionada**                            | Prefijo `/api/v1` para evolucionar sin romper clientes existentes.                                                                             |
| **Recursos en plural y verbos HTTP correctos** | `GET` lee, `POST` crea, `PUT/PATCH` modifica, `DELETE` elimina.                                                                                |
| **Códigos HTTP precisos**                      | `201` al crear, `204` sin contenido, `400` validación, `401` sin autenticar, `403` sin permiso, `404`, `409` conflicto, `429` límite excedido. |
| **Formato de error estándar**                  | Siempre `{ "error": { "code", "message", "details" } }`, de modo que el cliente maneja errores de forma uniforme.                              |
| **Paginación obligatoria**                     | Todos los listados aceptan `?page=&limit=` con un máximo, y responden con metadatos (`total`, `page`, `limit`).                                |
| **Validación en el borde**                     | Cada endpoint valida `body`, `query` y `params` con Zod antes de llegar al controlador.                                                        |
| **Idempotencia**                               | `PUT/DELETE` de favoritos y de canciones en playlist se pueden repetir sin efectos secundarios.                                                |
| **Documentación OpenAPI**                      | Swagger UI en `/docs`, siempre alineada con el código.                                                                                         |

### 3. Arquitectura y código

| Práctica                                      | Detalle y justificación                                                                                                              |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **TypeScript en modo `strict`**               | Tipado estático que previene errores comunes (valores nulos, campos mal escritos, roles mal comparados).                             |
| **Tipos derivados, no duplicados**            | Los tipos de la base de datos los genera Prisma y los de entrada se infieren del esquema Zod (`z.infer`): una sola fuente de verdad. |
| **Sin `any`**                                 | ESLint con `typescript-eslint` penaliza el uso de `any` para no perder las garantías del tipado.                                     |
| **Capas separadas**                           | Controladores sin lógica de negocio y servicios sin conocimiento de HTTP: más fáciles de probar y de cambiar.                        |
| **Organización por módulos de dominio**       | Todo lo de "playlists" vive junto; el proyecto escala sin volverse un caos de carpetas por tipo.                                     |
| **Manejo de errores centralizado**            | Un único `errorHandler` y una clase `AppError`; los servicios lanzan errores de dominio, no respuestas HTTP.                         |
| **Configuración validada y tipada al inicio** | Falla rápido si el entorno está mal configurado (_fail fast_) y expone un objeto `env` tipado.                                       |
| **Cierre ordenado**                           | Se atienden `SIGTERM`/`SIGINT` para terminar peticiones en curso antes de salir.                                                     |

### 4. Datos

| Práctica                                       | Detalle y justificación                                                                      |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Migraciones versionadas**                    | Todo cambio de esquema queda en Git y es reproducible en cualquier entorno.                  |
| **Índices en columnas de búsqueda y de unión** | `title`, `name`, `artistId`, `ownerId`, `(userId, playedAt)` para evitar escaneos completos. |
| **UUID como identificadores**                  | No expone cantidad de registros ni permite adivinar IDs consecutivos.                        |
| **Borrado en cascada controlado**              | Relaciones definidas explícitamente (`Cascade` / `SetNull`) para mantener integridad.        |
| **Prevención de N+1**                          | Uso de `include`/`select` de Prisma para cargar relaciones en una sola consulta.             |

### 5. Calidad y operación

| Práctica                                  | Detalle y justificación                                                            |
| ----------------------------------------- | ---------------------------------------------------------------------------------- |
| **Pruebas unitarias y de integración**    | Servicios con pruebas unitarias; endpoints con Supertest.                          |
| **Chequeo de tipos y lint automatizados** | `npm run typecheck` y `npm run lint` antes de cada commit.                         |
| **Integración continua**                  | Pipeline que ejecuta typecheck, lint y tests en cada push (propuesto para Fase 5). |
| **Compilación separada para producción**  | Se ejecuta el JavaScript compilado de `dist/`, sin herramientas de desarrollo.     |
| **Logs estructurados**                    | JSON con Pino, con ID de petición para trazabilidad.                               |
| **Endpoint `/health`**                    | Para monitoreo y _health checks_ de contenedores.                                  |
| **Contenedorización**                     | Docker para que el entorno sea idéntico en desarrollo y producción.                |
| **Dependencias auditadas**                | `npm audit` periódico y versiones fijadas con `package-lock.json`.                 |

### 6. Mejoras futuras (fuera del MVP)

- Caché con Redis para búsquedas y catálogo.
- Subida y streaming de audio con almacenamiento de objetos (S3 o similar).
- Recomendaciones basadas en el historial de reproducción.
- Verificación de email y recuperación de contraseña.
- Autenticación de dos factores.
- Métricas con Prometheus/Grafana.

---

## Fases del proyecto

- [x] **Fase 1:** Setup del proyecto en TypeScript, estructura, esquema de BD, Docker, configuración, manejo de errores, pruebas base
- [ ] **Fase 2:** Autenticación con JWT y refresh tokens
- [ ] **Fase 3:** Catálogo (artistas, álbumes, canciones) y búsqueda
- [ ] **Fase 4:** Playlists y biblioteca (favoritos e historial)
- [ ] **Fase 5:** Documentación Swagger, pruebas completas, Dockerfile y CI

---

## Licencia

Proyecto académico. Uso libre con fines educativos.
