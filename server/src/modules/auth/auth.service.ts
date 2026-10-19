import { ForbiddenException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NOMBRE_COOKIE, Sesion, crearToken, verificarToken } from "../../common/auth/cookie";
import { AUTH_PROVEEDOR, AuthProveedor } from "./proveedor/auth-proveedor";

export interface Credenciales {
  email: string;
  password: string;
}

export interface SesionActual extends Sesion {
  esPropietario: true;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_PROVEEDOR) private readonly proveedor: AuthProveedor,
    private readonly config: ConfigService,
  ) {}

  /**
   * Verifica las credenciales y devuelve el token de sesión.
   * Devuelve null si son incorrectas: el controller decide el 401.
   */
  async ingresar({ email, password }: Credenciales): Promise<string | null> {
    const correo = await this.proveedor.verificar(email, password);

    if (!correo) {
      return null;
    }

    // Solo el propietario tiene acceso, aunque la contraseña sea correcta.
    if (correo.toLowerCase() !== this.correoPropietario()) {
      throw new ForbiddenException("Esa cuenta no tiene acceso al panel");
    }

    return crearToken({ email: correo, emitidaEn: Date.now() }, this.secreto());
  }

  /** Lee la cookie de la petición y devuelve la sesión, o null. */
  leerCookie(token: string | undefined): SesionActual | null {
    if (!token) return null;

    const sesion = verificarToken(token, this.secreto());

    if (!sesion) return null;

    if (sesion.email.toLowerCase() !== this.correoPropietario()) {
      return null;
    }

    return { ...sesion, esPropietario: true };
  }

  salir() {
    return { httpOnly: true, sameSite: "lax" as const, path: "/" };
  }

  nombreCookie(): string {
    return NOMBRE_COOKIE;
  }

  private correoPropietario(): string {
    return (this.config.get<string>("OWNER_EMAIL") ?? "").trim().toLowerCase();
  }

  private secreto(): string {
    return this.config.get<string>("COOKIE_SECRET") ?? "";
  }
}

/** Lo usa el controller para responder 401 con el mensaje del spec §6. */
export function noAutorizado(): never {
  throw new UnauthorizedException("Correo o contraseña incorrectos");
}
