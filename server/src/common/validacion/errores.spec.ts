import { ValidationError } from "@nestjs/common";
import { MENSAJE_VALIDACION, erroresDeValidacion, excepcionDeValidacion } from "./errores";

function error(
  property: string,
  constraints: Record<string, string>,
  children: ValidationError[] = [],
): ValidationError {
  return { property, constraints, children };
}

describe("erroresDeValidacion", () => {
  it("convierte un fallo en el mapa campo -> mensaje", () => {
    const mapa = erroresDeValidacion([error("nombre", { minLength: "Escribe un nombre" })]);

    expect(mapa).toEqual({ nombre: "Escribe un nombre" });
  });

  it("con varios campos devuelve todos", () => {
    const mapa = erroresDeValidacion([
      error("email", { isEmail: "Ese correo no parece válido" }),
      error("password", { isString: "Escribe tu contraseña" }),
    ]);

    expect(mapa).toEqual({
      email: "Ese correo no parece válido",
      password: "Escribe tu contraseña",
    });
  });

  it("se queda con el primer mensaje de un campo con varias restricciones", () => {
    // Dos restricciones fallan en el mismo input: allí solo cabe una.
    const mapa = erroresDeValidacion([
      error("nombre", { isString: "Escribe un nombre", maxLength: "Máximo 60 caracteres" }),
    ]);

    expect(mapa).toEqual({ nombre: "Escribe un nombre" });
  });

  it("recorre los hijos de un objeto anidado", () => {
    const mapa = erroresDeValidacion([
      error("lugar", {}, [error("direccion", { isString: "Escribe la dirección" })]),
    ]);

    expect(mapa).toEqual({ direccion: "Escribe la dirección" });
  });

  it("traduce el campo que no existe en el DTO a español", () => {
    // forbidNonWhitelisted hace que class-validator escriba
    // "property sorpresa should not exist", en inglés y en inglés grueso.
    const mapa = erroresDeValidacion([
      error("sorpresa", { whitelistValidation: "property sorpresa should not exist" }),
    ]);

    expect(mapa).toEqual({ sorpresa: "Ese campo no existe" });
  });

  it("ignora los errores que no tienen propiedad", () => {
    // El payload no llega a ser objeto: no hay campo al que culpar.
    const mapa = erroresDeValidacion([
      {
        property: undefined,
        children: [],
        constraints: { unknownValue: "unknown value" },
      } as unknown as ValidationError,
      error("nombre", { minLength: "Escribe un nombre" }),
    ]);

    expect(mapa).toEqual({ nombre: "Escribe un nombre" });
  });

  it("devuelve mapa vacío si no hay errores", () => {
    expect(erroresDeValidacion([])).toEqual({});
  });
});

describe("excepcionDeValidacion", () => {
  it("responde con la forma uniforme del spec", () => {
    const excepcion = excepcionDeValidacion([error("nombre", { minLength: "Escribe un nombre" })]);

    expect(excepcion.getStatus()).toBe(400);
    expect(excepcion.getResponse()).toEqual({
      statusCode: 400,
      message: MENSAJE_VALIDACION,
      errores: { nombre: "Escribe un nombre" },
    });
  });
});
