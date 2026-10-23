import { BadRequestException, ValidationError } from "@nestjs/common";
import { ValidationTypes } from "class-validator";

/**
 * La forma uniforme de error del spec §6.
 *
 * El ValidationPipe de Nest, tal como viene, responde
 * `{ statusCode: 400, message: ["...", "..."], error: "Bad Request" }`:
 * un array de mensajes sueltos y nada por campo. El cliente pinta cada error
 * debajo de su campo, leído de `errores`, así que con ese formato no podría
 * pintar nada.
 *
 * Esta fábrica convierte los `ValidationError` de class-validator en:
 *
 *   { statusCode: 400, message: "Revisa los campos del formulario",
 *     errores: { nombre: "Escribe un nombre" } }
 *
 * `message` es un resumen genérico a propósito: es lo que se muestra debajo
 * del botón cuando el fallo no pertenece a ningún campo del formulario.
 */
export const MENSAJE_VALIDACION = "Revisa los campos del formulario";

/** class-validator escribe en inglés; el panel habla español. */
const MENSAJE_CAMPO_DESACONOCIDO = "Ese campo no existe";

/**
 * Aplana el árbol de errores a un mapa `campo -> mensaje`.
 *
 * · Si un campo tiene varias restricciones fallidas se queda con la primera:
 *   en un input solo cabe un mensaje, y esas restricciones suelen decir lo
 *   mismo con otras palabras.
 * · Los hijos (objetos anidados) se recorren en profundidad.
 * · Los errores sin propiedad —el caso del payload que no llega a ser un
 *   objeto— no pertenecen a ningún campo: quedan solo en el `message`.
 */
export function erroresDeValidacion(errores: ValidationError[]): Record<string, string> {
  const mapa: Record<string, string> = {};

  for (const error of errores) {
    const restricciones = error.constraints ?? {};
    const mensajes = Object.values(restricciones);
    const esCampoDesconocido = ValidationTypes.WHITELIST in restricciones;

    if (error.property && mensajes.length > 0 && mapa[error.property] === undefined) {
      mapa[error.property] = esCampoDesconocido ? MENSAJE_CAMPO_DESACONOCIDO : mensajes[0];
    }

    const hijos = error.children ?? [];
    if (hijos.length > 0) {
      Object.assign(mapa, erroresDeValidacion(hijos));
    }
  }

  return mapa;
}

/** La excepción que usa el ValidationPipe, ya en la forma del spec. */
export function excepcionDeValidacion(errores: ValidationError[]): BadRequestException {
  return new BadRequestException({
    statusCode: 400,
    message: MENSAJE_VALIDACION,
    errores: erroresDeValidacion(errores),
  });
}
