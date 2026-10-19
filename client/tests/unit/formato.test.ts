import { describe, expect, it } from "vitest";
import { formatearFecha, formatearHora, formatearMonto } from "@/lib/formato";

/**
 * Intl.NumberFormat pone un espacio duro (U+00A0) entre "S/" y el número.
 * Es correcto: mantiene el símbolo pegado a la cifra. En los tests
 * normalizamos para no depender de ese caracter invisible.
 */
const ESPACIO_DURO = /\u00A0/g;
const sinEspaciosDuros = (texto: string) => texto.replace(ESPACIO_DURO, " ");

describe("formatearMonto", () => {
  it("muestra soles con dos decimales", () => {
    expect(sinEspaciosDuros(formatearMonto(50))).toBe("S/ 50.00");
  });

  it("acepta el string que devuelve la API", () => {
    expect(sinEspaciosDuros(formatearMonto("85.00"))).toBe("S/ 85.00");
  });

  it("respeta los céntimos", () => {
    expect(sinEspaciosDuros(formatearMonto("1234.5"))).toBe("S/ 1,234.50");
  });

  it("usa el grupo de miles con coma", () => {
    expect(sinEspaciosDuros(formatearMonto("999999.99"))).toBe("S/ 999,999.99");
  });

  it("no revienta con un valor inválido", () => {
    expect(formatearMonto("no es un numero")).toBe("S/ —");
  });
});

describe("formatearFecha", () => {
  it("una fecha sin hora es el día del calendario, no un instante UTC", () => {
    // new Date("2026-10-20") es medianoche UTC, que en Lima sería el 19.
    expect(formatearFecha("2026-10-20")).toBe("20/10/2026");
  });

  it("convierte a Lima, no a la zona del navegador", () => {
    // 02:00 UTC del 20 son las 21:00 del 19 en Lima (UTC-5)
    expect(formatearFecha("2026-10-20T02:00:00Z")).toBe("19/10/2026");
  });

  it("acepta un objeto Date", () => {
    expect(formatearFecha(new Date(2026, 9, 20))).toBe("20/10/2026");
  });

  it("no revienta con una fecha inválida", () => {
    expect(formatearFecha("ayer")).toBe("—");
    expect(formatearFecha("")).toBe("—");
  });
});

describe("formatearHora", () => {
  it("muestra hora de 24 horas", () => {
    expect(formatearHora("2026-10-20T18:00:00Z")).toBe("13:00");
  });
});
