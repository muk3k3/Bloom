import {
  applyDecorators,
  ExecutionContext,
  SetMetadata,
  UseGuards,
  createParamDecorator,
} from "@nestjs/common";
import { UsaPropietarioGuard } from "../guards/usa-propietario.guard";

/**
 * Marca los endpoints que exigen sesión del propietario.
 * Aplica el guard, así que no hace falta añadirlo aparte:
 *
 *   @UsaPropietario()
 *   @Post("algo")
 *   crear() {}
 */
export const UsaPropietario = () =>
  applyDecorators(SetMetadata("usaPropietario", true), UseGuards(UsaPropietarioGuard));

/**
 * El propietario de la petición. Solo funciona si el endpoint lleva
 * @UsaPropietario().
 */
export const Propietario = createParamDecorator((_datos: unknown, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest().propietario;
});
