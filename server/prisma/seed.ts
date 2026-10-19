/**
 * Datos de ejemplo para desarrollo.
 *
 *   npm run prisma:seed --workspace=server
 *
 * Es idempotente: si ya existe, actualiza en vez de duplicar.
 *
 * Nota: los productos se crean SIN fotos. El módulo `media` (T8/T9) es el que
 * sube y optimiza imágenes, y un registro Foto sin archivo real en el
 * almacenamiento sería un dato falso. El catálogo muestra un placeholder.
 *
 * OJO: los identificadores van sin tildes ni ñ (categoría -> categoria),
 * pero TODO el texto que verá una persona sí lleva tildes.
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../src/generated/prisma/client.js";

const DESARROLLO = "postgresql://bloom:bloom@localhost:5433/bloom?schema=public";

// El seed corre fuera de NestJS, así que lee el entorno por su cuenta.
for (const [clave, valor] of Object.entries({
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
})) {
  if (valor) process.env[clave] = valor;
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? DESARROLLO }),
});

const CATEGORIAS = [
  { nombre: "Romántica", slug: "romatica", orden: 1 },
  { nombre: "Condolencias", slug: "condolencias", orden: 2 },
  { nombre: "Corporativo", slug: "corporativo", orden: 3 },
];

const PRODUCTOS = [
  {
    nombre: "Ramo de rosas rojas",
    slug: "ramo-de-rosas-rojas",
    descripcion:
      "Doce rosas rojas de tallo largo, envueltas en papel kraft con un listón de satín. El arreglo más pedido para aniversarios y romance.",
    precio: "85.00",
    categoria: "romatica",
    orden: 1,
  },
  {
    nombre: "Ramo de rosas rosadas",
    slug: "ramo-de-rosas-rosadas",
    descripcion:
      "Quince rosas rosadas de importación, con follaje verde natural. Delicado y luminoso, ideal para un detalle.",
    precio: "110.00",
    categoria: "romatica",
    orden: 2,
  },
  {
    nombre: "Arreglo de tulipanes",
    slug: "arreglo-de-tulipanes",
    descripcion:
      "Veinte tulipanes de varios colores en un arreglo bajo de cristal. Se arma fresco cada mañana.",
    precio: "145.00",
    categoria: "romatica",
    orden: 3,
  },
  {
    nombre: "Arreglo de flores blancas",
    slug: "arreglo-de-flores-blancas",
    descripcion:
      "Lirios, rosas y crisantemos blancos en un recipiente de cerámica. Un mensaje de respeto y calma.",
    precio: "180.00",
    categoria: "condolencias",
    orden: 4,
  },
  {
    nombre: "Arreglo para funerales",
    slug: "arreglo-para-funerales",
    descripcion:
      "Arreglo sobrio de flores blancas y verdes. Entrega el mismo día si se solicita antes de las 11:00.",
    precio: "220.00",
    categoria: "condolencias",
    orden: 5,
  },
  {
    nombre: "Centro de mesa floral",
    slug: "centro-de-mesa-floral",
    descripcion:
      "Arreglo bajo para mesa de evento, con flores de estación. Se adapta a la cantidad de invitados.",
    precio: "160.00",
    categoria: "corporativo",
    orden: 6,
  },
  {
    nombre: "Ramillete con portaobjetos",
    slug: "ramillete-con-portaobjetos",
    descripcion:
      "Ramillete compacto con portaobjetos y flores hidratadas. Cómodo de llevar y de larga duración.",
    precio: "65.00",
    categoria: "corporativo",
    orden: 7,
  },
  {
    nombre: "Canastilla de flores",
    slug: "canastilla-de-flores",
    descripcion:
      "Canastilla con flores mezcladas y follaje. Para decorar un escritorio o acompañar un regalo.",
    precio: "55.00",
    categoria: "corporativo",
    orden: 8,
  },
];

const NEGOCIO = {
  nombre: "Bloom",
  whatsapp: "51987654321",
  descripcion:
    "Floristería de barrio. Armamos ramos y arreglos con calma, a mano y con flores frescas.",
  direccion: "Av. Ejemplo 1234, Miraflores, Lima",
  mapaUrl: "https://maps.google.com/?q=Miraflores+Lima",
  instagramUrl: "https://instagram.com/bloom",
  facebookUrl: "https://facebook.com/bloom",
  horarios: {
    lunes: "09:00 - 20:00",
    martes: "09:00 - 20:00",
    miercoles: "09:00 - 20:00",
    jueves: "09:00 - 20:00",
    viernes: "09:00 - 21:00",
    sabado: "09:00 - 21:00",
    domingo: "10:00 - 18:00",
  },
};

async function main() {
  const categorias = new Map<string, string>();

  for (const categoria of CATEGORIAS) {
    const guardada = await prisma.categoria.upsert({
      where: { slug: categoria.slug },
      update: { nombre: categoria.nombre, orden: categoria.orden },
      create: categoria,
    });
    categorias.set(categoria.slug, guardada.id);
  }
  console.warn(`  ${categorias.size} categorías listas`);

  for (const producto of PRODUCTOS) {
    const { categoria, precio, ...datos } = producto;

    await prisma.producto.upsert({
      where: { slug: producto.slug },
      update: { ...datos, categoriaId: categorias.get(categoria) ?? null },
      create: {
        ...datos,
        precio: new Prisma.Decimal(precio),
        categoriaId: categorias.get(categoria) ?? null,
      },
    });
  }
  console.warn(`  ${PRODUCTOS.length} productos listos`);

  await prisma.informacionNegocio.upsert({
    where: { id: "unico" },
    update: NEGOCIO,
    create: { id: "unico", ...NEGOCIO },
  });
  console.warn("  información del negocio lista");
}

main()
  .catch((error) => {
    console.error("Falló el seed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
