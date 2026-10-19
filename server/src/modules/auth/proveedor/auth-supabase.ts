import { Injectable } from "@nestjs/common";
import { AuthProveedor } from "./auth-proveedor";

/**
 * Autenticación contra Supabase Auth, por su API REST.
 *
 * Se usa fetch en lugar del SDK de Supabase a propósito: es una sola
 * petición, y meter @supabase/supabase-js por esto traería un árbol de
 * dependencias enorme al servidor para ganar nada. Si algún día hace falta
 * refresh token o magic link, ahí sí el SDK se justifica.
 */
@Injectable()
export class AuthSupabase implements AuthProveedor {
  constructor(
    private readonly url: string,
    private readonly clave: string,
  ) {}

  async verificar(email: string, password: string): Promise<string | null> {
    const respuesta = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: this.clave,
        Authorization: `Bearer ${this.clave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email.trim(), password }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!respuesta.ok) {
      // 400 = credenciales malas. Cualquier otro es un problema nuestro.
      return null;
    }

    const cuerpo = (await respuesta.json()) as { email?: string; user?: { email?: string } };

    return cuerpo.email ?? cuerpo.user?.email ?? null;
  }
}
