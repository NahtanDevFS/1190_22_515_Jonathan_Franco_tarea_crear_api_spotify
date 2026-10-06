-- CreateEnum
CREATE TYPE "rol" AS ENUM ('USUARIO', 'ADMIN');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "nombre_usuario" TEXT NOT NULL,
    "contrasena_hash" TEXT NOT NULL,
    "rol" "rol" NOT NULL DEFAULT 'USUARIO',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens_refresco" (
    "id" TEXT NOT NULL,
    "hash_token" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "revocado_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_refresco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artistas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "biografia" TEXT,

    CONSTRAINT "artistas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "albumes" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "fecha_lanzamiento" TIMESTAMP(3),
    "artista_id" TEXT NOT NULL,

    CONSTRAINT "albumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canciones" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "duracion_seg" INTEGER NOT NULL,
    "album_id" TEXT,
    "artista_id" TEXT NOT NULL,

    CONSTRAINT "canciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listas_reproduccion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "es_publica" BOOLEAN NOT NULL DEFAULT false,
    "propietario_id" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listas_reproduccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lista_canciones" (
    "lista_id" TEXT NOT NULL,
    "cancion_id" TEXT NOT NULL,
    "posicion" INTEGER NOT NULL,
    "agregada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lista_canciones_pkey" PRIMARY KEY ("lista_id","cancion_id")
);

-- CreateTable
CREATE TABLE "favoritos" (
    "usuario_id" TEXT NOT NULL,
    "cancion_id" TEXT NOT NULL,

    CONSTRAINT "favoritos_pkey" PRIMARY KEY ("usuario_id","cancion_id")
);

-- CreateTable
CREATE TABLE "historial_reproduccion" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "cancion_id" TEXT NOT NULL,
    "reproducida_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_reproduccion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_nombre_usuario_key" ON "usuarios"("nombre_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_refresco_hash_token_key" ON "tokens_refresco"("hash_token");

-- CreateIndex
CREATE INDEX "tokens_refresco_usuario_id_idx" ON "tokens_refresco"("usuario_id");

-- CreateIndex
CREATE INDEX "artistas_nombre_idx" ON "artistas"("nombre");

-- CreateIndex
CREATE INDEX "albumes_titulo_idx" ON "albumes"("titulo");

-- CreateIndex
CREATE INDEX "albumes_artista_id_idx" ON "albumes"("artista_id");

-- CreateIndex
CREATE INDEX "canciones_titulo_idx" ON "canciones"("titulo");

-- CreateIndex
CREATE INDEX "canciones_artista_id_idx" ON "canciones"("artista_id");

-- CreateIndex
CREATE INDEX "listas_reproduccion_propietario_id_idx" ON "listas_reproduccion"("propietario_id");

-- CreateIndex
CREATE INDEX "historial_reproduccion_usuario_id_reproducida_en_idx" ON "historial_reproduccion"("usuario_id", "reproducida_en");

-- AddForeignKey
ALTER TABLE "tokens_refresco" ADD CONSTRAINT "tokens_refresco_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "albumes" ADD CONSTRAINT "albumes_artista_id_fkey" FOREIGN KEY ("artista_id") REFERENCES "artistas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canciones" ADD CONSTRAINT "canciones_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albumes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canciones" ADD CONSTRAINT "canciones_artista_id_fkey" FOREIGN KEY ("artista_id") REFERENCES "artistas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listas_reproduccion" ADD CONSTRAINT "listas_reproduccion_propietario_id_fkey" FOREIGN KEY ("propietario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lista_canciones" ADD CONSTRAINT "lista_canciones_lista_id_fkey" FOREIGN KEY ("lista_id") REFERENCES "listas_reproduccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lista_canciones" ADD CONSTRAINT "lista_canciones_cancion_id_fkey" FOREIGN KEY ("cancion_id") REFERENCES "canciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_cancion_id_fkey" FOREIGN KEY ("cancion_id") REFERENCES "canciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_reproduccion" ADD CONSTRAINT "historial_reproduccion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_reproduccion" ADD CONSTRAINT "historial_reproduccion_cancion_id_fkey" FOREIGN KEY ("cancion_id") REFERENCES "canciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
