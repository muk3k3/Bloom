/**
 * Verificación del entorno al arrancar.
 *
 * Falla rápido y con un mensaje claro. Es preferible que el servidor no
 * levante antes que que arranque con la configuración a medias y falle
 * en el primer login.
 */

export class ErrorDeEntorno extends Error {
  constructor(faltantes: string[]) {
    super(
      `Faltan variables de entorno: ${faltantes.join(", ")}. ` +
        `Revisa server/.env (copiar de .env.example).`,
    );
    this.name = "ErrorDeEntorno";
  }
}

const REQUERIDAS = ["OWNER_EMAIL", "COOKIE_SECRET"] as const;

/**
 * Lanza si falta algo. El servidor no arranca sin esto.
 */
export function exigirEntorno(valores: Record<string, string | undefined>): void {
  const faltantes = REQUERIDAS.filter((clave) => {
    const valor = valores[clave];
    return !valor || valor.trim() === "";
  });

  // El ejemplo de .env.example no sirve como secreto real
  if (valores.COOKIE_SECRET?.includes("cambia-esto")) {
    throw new ErrorDeEntorno(["COOKIE_SECRET (sigue con el valor de ejemplo)"]);
  }

  if (faltantes.length > 0) {
    throw new ErrorDeEntorno(faltantes);
  }
}

/**
 * Comprueba sin lanzar. Para los tests, que no quieren depender del entorno.
 */
export function faltaAlgo(valores: Record<string, string | undefined>): string[] {
  return REQUERIDAS.filter((clave) => !valores[clave] || valores[clave]!.trim() === "");
}
