import { defineConfig } from "prisma/config";

/**
 * ConfiguraciÃ³n de Prisma 7.
 *
 * En Prisma 7 la conexiÃ³n ya NO vive en schema.prisma: va aquÃ­.
 * El cliente, por su parte, recibe un driver adapter (ver prisma.service.ts).
 *
 * Nota sobre Supabase y PgBouncer: el adaptador usa node-postgres, que por
 * defecto emplea statements sin nombre. Por eso funciona contra un pooler en
 * modo transaction y ya no hace falta el parÃ¡metro `?pgbouncer=true`.
 */
const DESARROLLO = "postgresql://bloom:bloom@localhost:5433/bloom?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },

  datasource: {
    // Se lee sin env() a propÃ³sito: `prisma generate` corre en la CI sin base
    // de datos, y env() lanzarÃ­a si la variable no existe.
    url: process.env.DATABASE_URL ?? DESARROLLO,
  },
});
