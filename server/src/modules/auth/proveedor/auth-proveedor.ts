/**
 * Proveedor de autenticación.
 *
 * Igual que el almacenamiento de fotos: el service no sabe contra qué está
 * verificando. En desarrollo es AuthLocal, en producción AuthSupabase.
 */
export interface AuthProveedor {
  /** Devuelve el correo si las credenciales son correctas, null si no. */
  verificar(email: string, password: string): Promise<string | null>;
}

/** Se construye según las variables de entorno. */
export const AUTH_PROVEEDOR = Symbol("AUTH_PROVEEDOR");

export function nombreProveedor(autenticacion: string | undefined): string {
  return autenticacion?.toLowerCase() === "supabase" ? "supabase" : "local";
}
