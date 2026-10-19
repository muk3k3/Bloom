/**
 * Cookie de sesión.
 *
 * Es httpOnly: el JavaScript del navegador no puede leerla, así que un XSS
 * no puede robarla. El servidor la firma con HMAC y la verifica en cada
 * petición.
 *
 *NO se guarda nada del propietario: solo su correo y la emisión.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export const NOMBRE_COOKIE = "bloom_sesion";

export interface Sesion {
  email: string;
  emitidaEn: number;
}

/** 7 días, en milisegundos. */
export const DURACION_MS = 7 * 24 * 60 * 60 * 1000;

function firmar(datos: string, secreto: string): string {
  return createHmac("sha256", secreto).update(datos).digest("base64url");
}

function aBase64url(texto: string): string {
  return Buffer.from(texto, "utf8").toString("base64url");
}

/** Serializa y firma una sesión. */
export function crearToken(sesion: Sesion, secreto: string): string {
  const cuerpo = aBase64url(JSON.stringify(sesion));
  return `${cuerpo}.${firmar(cuerpo, secreto)}`;
}

/**
 * Verifica firma y contenido. Devuelve null si algo no cuadra.
 *
 * La comparación de la firma es de tiempo constante para que nadie pueda
 * deducir el valor probando carácter a carácter.
 */
export function verificarToken(token: string, secreto: string): Sesion | null {
  const partes = token.split(".");
  if (partes.length !== 2) return null;

  const [cuerpo, firma] = partes;
  const esperada = firmar(cuerpo, secreto);

  const a = Buffer.from(firma);
  const b = Buffer.from(esperada);

  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let sesion: Sesion;
  try {
    sesion = JSON.parse(Buffer.from(cuerpo, "base64url").toString("utf8")) as Sesion;
  } catch {
    return null;
  }

  if (typeof sesion.email !== "string" || sesion.email === "") return null;
  if (typeof sesion.emitidaEn !== "number") return null;

  // Expirada
  if (Date.now() - sesion.emitidaEn > DURACION_MS) return null;

  return sesion;
}

/** Opciones de la cookie. httpOnly va primero y en mayúsculas a propósito. */
export function opcionesCookie(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: DURACION_MS,
  };
}
