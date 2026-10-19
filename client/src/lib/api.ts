/**
 * Cliente de la API.
 *
 * Todas las llamadas van a `/api/...` en el mismo origen: `next.config.ts`
 * reescribe ese prefijo al server. Así la cookie httpOnly de sesión viaja sola
 * y no hay que configurar CORS con credenciales.
 */

export interface ErrorDeApi {
  statusCode: number;
  message: string;
  errores?: Record<string, string>;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly errores: Record<string, string>;

  constructor({ statusCode, message, errores }: ErrorDeApi) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errores = errores ?? {};
  }
}

const BASE = "/api";

async function pedir<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const respuesta = await fetch(`${BASE}${ruta}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...opciones.headers,
    },
    ...opciones,
  });

  if (!respuesta.ok) {
    // El server siempre responde con la misma forma (SPEC §6)
    const cuerpo = (await respuesta.json().catch(() => null)) as Partial<ErrorDeApi> | null;

    throw new ApiError({
      statusCode: respuesta.status,
      message: cuerpo?.message ?? "Algo salió mal. Inténtalo de nuevo.",
      errores: cuerpo?.errores ?? undefined,
    });
  }

  if (respuesta.status === 204) {
    return undefined as T;
  }

  return (await respuesta.json()) as T;
}

export const api = {
  get: <T>(ruta: string) => pedir<T>(ruta),
  post: <T>(ruta: string, cuerpo?: unknown) =>
    pedir<T>(ruta, {
      method: "POST",
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    }),
  patch: <T>(ruta: string, cuerpo: unknown) =>
    pedir<T>(ruta, { method: "PATCH", body: JSON.stringify(cuerpo) }),
  put: <T>(ruta: string, cuerpo: unknown) =>
    pedir<T>(ruta, { method: "PUT", body: JSON.stringify(cuerpo) }),
  delete: <T>(ruta: string) => pedir<T>(ruta, { method: "DELETE" }),
};

/** URL de WhatsApp con el mensaje ya escrito. Ver lib/whatsapp.ts en T14. */
export function whatsappDe(telefono: string, mensaje: string): string {
  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
}
