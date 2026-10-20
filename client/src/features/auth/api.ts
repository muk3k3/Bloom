/**
 * API de autenticación.
 *
 * La sesión vive en una cookie httpOnly que firma el servidor. El cliente no
 * puede leerla ni guardarla: solo pregunta "¿quién soy?" con /auth/yo y
 * obedece la respuesta. Eso significa que la única fuente de verdad es el
 * servidor, y no hay estado de sesión que sincronizar entre pestañas.
 */

import { api } from "@/lib/api";

export interface Sesion {
  email: string;
}

export interface Credenciales {
  email: string;
  password: string;
}

export const authApi = {
  /** Devuelve el correo del propietario, o lanza 401 si no hay sesión. */
  yo: () => api.get<Sesion>("/auth/yo"),

  /** Establece la cookie en el navegador. Lanza 401 si las credenciales son malas. */
  ingresar: (credenciales: Credenciales) =>
    api.post<{ mensaje: string }>("/auth/ingresar", credenciales),

  /** Borra la cookie. */
  salir: () => api.post<{ mensaje: string }>("/auth/salir"),
};
