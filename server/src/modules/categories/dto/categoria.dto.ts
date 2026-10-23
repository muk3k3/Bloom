import { Transform } from "class-transformer";
import { IsString, MaxLength, MinLength } from "class-validator";

/**
 * El cuerpo de POST /api/categorias y PATCH /api/categorias/:id.
 *
 * Va en una clase y no en una interfaz a propósito: TypeScript borra las
 * interfaces al compilar y ValidationPipe no tendría nada que validar.
 * Es el mismo motivo por el que CredencialesDto existe.
 */
export class CategoriaDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString({ message: "Escribe un nombre" })
  @MinLength(1, { message: "Escribe un nombre" })
  @MaxLength(60, { message: "El nombre puede tener hasta 60 caracteres" })
  nombre!: string;
}
