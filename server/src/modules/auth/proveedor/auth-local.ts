import { Injectable } from "@nestjs/common";
import { AuthProveedor } from "./auth-proveedor";

/**
 * Autenticación de desarrollo.
 *
 * Compara contra OWNER_EMAIL y OWNER_PASSWORD con una comparación de tiempo
 * constante. No guarda contraseñas: no hay tabla de usuarios, porque hay un
 * solo propietario y su cuenta vive en Supabase Auth.
 *
 * Solo se usa si AUTH=local. Con AUTH=supabase esto no se instancia.
 */
@Injectable()
export class AuthLocal implements AuthProveedor {
  constructor(
    private readonly email: string,
    private readonly password: string,
  ) {}

  async verificar(email: string, password: string): Promise<string | null> {
    const correoOk = comparar(this.email, email.trim().toLowerCase());
    const claveOk = comparar(this.password, password);

    // Se comparan las dos igual y se decide después: así el tiempo de
    // respuesta no revela si el correo existe.
    return correoOk && claveOk ? email.trim().toLowerCase() : null;
  }
}

/** Comparación en tiempo constante. */
function comparar(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let diferencia = 0;
  for (let i = 0; i < a.length; i += 1) {
    diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diferencia === 0;
}
