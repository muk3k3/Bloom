import { normalizarSlug } from "./slug";

describe("normalizarSlug", () => {
  it("convierte un nombre con & en guiones con y", () => {
    expect(normalizarSlug("Boda & Amor")).toBe("boda-y-amor");
  });

  it("quita tildes y ñ", () => {
    expect(normalizarSlug("Ramo de Añadir Ñoño")).toBe("ramo-de-anadir-nono");
  });

  it("colapsa espacios repetidos y recorta los guiones de los extremos", () => {
    expect(normalizarSlug("  Ramos   de Rosas  ")).toBe("ramos-de-rosas");
  });

  it("deja afuera todo lo que no sea letra o número", () => {
    expect(normalizarSlug("¡Ofertas 2026!")).toBe("ofertas-2026");
  });

  it("devuelve vacío si no queda nada usable", () => {
    expect(normalizarSlug("!!!")).toBe("");
  });
});
