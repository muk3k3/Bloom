-- CreateTable
CREATE TABLE "producto" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "categoria_id" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categoria" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(60) NOT NULL,
    "slug" VARCHAR(70) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foto" (
    "id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "ruta_original" TEXT NOT NULL,
    "ruta_thumbnail" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "foto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "informacion_negocio" (
    "id" TEXT NOT NULL DEFAULT 'unico',
    "nombre" VARCHAR(120) NOT NULL,
    "whatsapp" VARCHAR(20) NOT NULL,
    "descripcion" TEXT,
    "direccion" VARCHAR(200),
    "mapa_url" TEXT,
    "instagram_url" TEXT,
    "facebook_url" TEXT,
    "horarios" JSONB,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "informacion_negocio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "producto_slug_key" ON "producto"("slug");

-- CreateIndex
CREATE INDEX "producto_activo_orden_idx" ON "producto"("activo", "orden");

-- CreateIndex
CREATE INDEX "producto_categoria_id_idx" ON "producto"("categoria_id");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_nombre_key" ON "categoria"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_slug_key" ON "categoria"("slug");

-- CreateIndex
CREATE INDEX "foto_producto_id_idx" ON "foto"("producto_id");

-- AddForeignKey
ALTER TABLE "producto" ADD CONSTRAINT "producto_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foto" ADD CONSTRAINT "foto_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
