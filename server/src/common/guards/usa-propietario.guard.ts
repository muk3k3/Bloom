import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "../../modules/auth/auth.service";

declare module "express" {
  interface Request {
    propietario?: { email: string; emitidaEn: number };
  }
}

/**
 * Gate de todo el panel.
 *
 * Se aplica con el decorador @UsaPropietario() sobre el controller o el método.
 *
 *   · Sin cookie, o con cookie inválida o vencida → 401
 *   · Con sesión válida de otra persona         → 401 (no 403: desde afuera
 *     no hay diferencia entre "no existe" y "no te toca")
 *
 * La distinction 403 del spec §6 se aplica en AuthService.ingresar, cuando las
 * credenciales son correctas pero la cuenta no es la del propietario.
 */
@Injectable()
export class UsaPropietarioGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(contexto: ExecutionContext): boolean {
    const peticion = contexto.switchToHttp().getRequest<Request>();
    const token = peticion.cookies?.[this.auth.nombreCookie()];
    const sesion = this.auth.leerCookie(token);

    if (!sesion) {
      throw new UnauthorizedException("Necesitas iniciar sesión");
    }

    peticion.propietario = { email: sesion.email, emitidaEn: sesion.emitidaEn };

    return true;
  }
}
