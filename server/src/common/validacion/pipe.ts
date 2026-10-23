import { ValidationPipe } from "@nestjs/common";
import { excepcionDeValidacion } from "./errores";

/**
 * El pipe con el que corre toda la API.
 *
 * Vive en su propia función y no en main.ts a propósito: las pruebas de
 * integración lo piden de acá. Si cada uno armara su ValidationPipe, la
 * prueba podría estar validando distinto a cómo valida el server que se
 * despliega — y eso ya nos costó cuatro bugs de cableado en la T4.
 */
export function crearValidacion(): ValidationPipe {
  return new ValidationPipe({
    // Borra del body lo que el DTO no declara y rifa lo que sobre: un atacante
    // no puede mandar `rol: "admin"` esperando que alguien lo lea.
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    // Respuesta en la forma uniforme del spec §6: sin esto sale
    // { message: [...] } y el cliente no tiene por dónde pintar cada error.
    exceptionFactory: excepcionDeValidacion,
  });
}
