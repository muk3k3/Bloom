import { ErrorDeEntorno, exigirEntorno, faltaAlgo } from "./entorno";

const COMPLETO = {
  OWNER_EMAIL: "dueno@bloom.local",
  COOKIE_SECRET: "un-secreto-real-de-32-caracteres",
};

describe("exigirEntorno", () => {
  it("pasa con todo presente", () => {
    expect(() => exigirEntorno(COMPLETO)).not.toThrow();
  });

  it("lanza si falta OWNER_EMAIL", () => {
    expect(() => exigirEntorno({ ...COMPLETO, OWNER_EMAIL: "" })).toThrow(ErrorDeEntorno);
  });

  it("lanza si falta COOKIE_SECRET", () => {
    expect(() => exigirEntorno({ ...COMPLETO, COOKIE_SECRET: undefined })).toThrow(ErrorDeEntorno);
  });

  it("lanza si el secreto sigue siendo el de ejemplo", () => {
    expect(() =>
      exigirEntorno({
        ...COMPLETO,
        COOKIE_SECRET: "cambia-esto-por-una-cadena-aleatoria",
      }),
    ).toThrow(ErrorDeEntorno);
  });

  it("el mensaje dice qué falta", () => {
    expect(() => exigirEntorno({ OWNER_EMAIL: "a@b.c" })).toThrow(/COOKIE_SECRET/);
  });

  it("ignora espacios en blanco", () => {
    expect(() => exigirEntorno({ ...COMPLETO, OWNER_EMAIL: "   " })).toThrow(ErrorDeEntorno);
  });
});

describe("faltaAlgo", () => {
  it("lista lo que falta sin lanzar", () => {
    expect(faltaAlgo({ OWNER_EMAIL: "a@b.c" })).toEqual(["COOKIE_SECRET"]);
  });

  it("devuelve vacío si está todo", () => {
    expect(faltaAlgo(COMPLETO)).toEqual([]);
  });
});
