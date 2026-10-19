#!/usr/bin/env node
/**
 * Prepara el proyecto tras clonarlo.
 *
 *   npm run setup
 *
 * Es idempotente: se puede volver a ejecutar sin romper nada.
 */

import { execSync } from "node:child_process";
import { existsSync, copyFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");

const paso = (mensaje) => console.log(`\n[36m▸ ${mensaje}[0m`);
const ok = (mensaje) => console.log(`  [32m✓[0m ${mensaje}`);
const aviso = (mensaje) => console.log(`  [33m![0m ${mensaje}`);

function ejecutar(comando, opciones = {}) {
  execSync(comando, {
    cwd: RAIZ,
    stdio: "inherit",
    shell: process.platform === "win32",
    ...opciones,
  });
}

function capturar(comando) {
  try {
    return execSync(comando, { cwd: RAIZ, encoding: "utf8", shell: process.platform === "win32" });
  } catch {
    return "";
  }
}

function scriptsDe(paquete) {
  const archivo = join(RAIZ, paquete, "package.json");
  if (!existsSync(archivo)) return null;
  return Object.keys(JSON.parse(readFileSync(archivo, "utf8")).scripts ?? {});
}

// ---------------------------------------------------------------- Node

paso("Verificando Node");
const mayor = Number(process.versions.node.split(".")[0]);
if (mayor < 20) {
  console.error(`  [31m✗[0m Necesitas Node 20 o superior. Tienes ${process.versions.node}.`);
  process.exit(1);
}
ok(`Node ${process.versions.node}`);

// ------------------------------------------------------------ Paquetes

paso("Instalando dependencias");
ejecutar("npm install");
ok("Dependencias instaladas");

// ------------------------------------------------------------- Entorno

paso("Preparando el archivo de entorno");
for (const paquete of ["server", "client"]) {
  const ejemplo = join(RAIZ, paquete, ".env.example");
  const destino = join(RAIZ, paquete, ".env");
  if (existsSync(ejemplo) && !existsSync(destino)) {
    copyFileSync(ejemplo, destino);
    ok(`${paquete}/.env creado desde .env.example`);
  } else if (existsSync(destino)) {
    ok(`${paquete}/.env ya existe, no se toca`);
  } else {
    aviso(`${paquete}/.env.example todavía no existe (se creará en su tarea)`);
  }
}

// ------------------------------------------------------------ Postgres

paso("Levantando PostgreSQL con Docker");
if (capturar("docker --version").includes("Docker")) {
  ejecutar("docker compose up -d postgres");

  // La primera vez el contenedor tarda unos segundos en aceptar conexiones
  let listo = false;
  for (let intento = 0; intento < 30; intento += 1) {
    const salida = capturar("docker compose exec -T postgres pg_isready -U bloom");
    if (salida.includes("accepting connections")) {
      listo = true;
      break;
    }
    process.stdout.write(`  · esperando PostgreSQL (${intento + 1}/30)\r`);
    execSync("ping -n 2 127.0.0.1 > nul || sleep 1", { shell: true });
  }
  process.stdout.write("                                          \r");

  if (listo) ok("PostgreSQL responde en el puerto 5433");
  else aviso("PostgreSQL no respondió a tiempo. Revisa con: docker compose logs postgres");
} else {
  aviso("No se encontró Docker. Si usas Supabase, define DATABASE_URL en server/.env");
}

// ----------------------------------------------------------- Prisma

const scriptsServer = scriptsDe("server");
if (scriptsServer) {
  paso("Preparando la base de datos");

  if (scriptsServer["prisma:generate"]) {
    ejecutar("npm run prisma:generate --workspace=server");
    ok("Cliente de Prisma generado");
  }

  const desplegar = scriptsServer["prisma:deploy"];
  const migrar = scriptsServer["prisma:migrate"];
  if (desplegar) {
    ejecutar("npm run prisma:deploy --workspace=server");
    ok("Migraciones aplicadas");
  } else if (migrar) {
    aviso("No hay script prisma:deploy. Revisa las migraciones a mano");
  }

  if (scriptsServer["prisma:seed"]) {
    ejecutar("npm run prisma:seed --workspace=server");
    ok("Datos de ejemplo cargados");
  }
} else {
  aviso("El paquete server/ todavía no existe; se omite la base de datos");
}

// --------------------------------------------------------------- Fin

console.log(`
[32m  Bloom listo.[0m

  npm run dev      sitio en :3000, API en :3001
  npm run test     pruebas
  npm run lint     revisar código

  Credenciales de desarrollo: dueno@bloom.local / Bloom2026!
`);
