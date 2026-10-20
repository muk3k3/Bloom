import { IsEmail, IsNotEmpty, IsString } from "class-validator";

/**
 * Credenciales de ingreso.
 *
 * Es una clase y no una interface a propósito: TypeScript borra las
 * interfaces al compilar, así que el ValidationPipe no tendría con qué
 * validar y el endpoint aceptaría cualquier cosa. Con decoradores, la
 * validación ocurre en el servidor aunque el cliente no mande nada de esto
 * (que es justo lo que asume un atacante).
 */
export class CredencialesDto {
  @IsEmail({}, { message: "Ese correo no parece válido" })
  email!: string;

  @IsString({ message: "Escribe tu contraseña" })
  @IsNotEmpty({ message: "Escribe tu contraseña" })
  password!: string;
}
