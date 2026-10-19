/**
 * Formateo para mostrar datos al cliente.
 *
 * Reglas del proyecto:
 *   · El dinero es `Decimal` en la API y sale con dos decimales, en soles
 *   · Las fechas van dd/mm/aaaa
 *   · La zona horaria siempre es America/Lima (UTC-5), no la del navegador
 */

const ZONA = "America/Lima";

/** Una fecha sin hora: "2026-10-20" */
const SOLO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Convierte la entrada en un Date, o null si no es una fecha válida.
 *
 * Trampa importante: `new Date("2026-10-20")` se interpreta como medianoche
 * **UTC**, que en Lima son las 19:00 del día anterior. Sin esto, una fecha
 * guardada el 20 se mostraría como 19.
 *
 * Un string con hora ("2026-10-20T18:00:00Z") sí es un instante, y se
 * convierte a Lima como corresponde.
 */
function aFecha(entrada: string | Date): Date | null {
  if (entrada instanceof Date) {
    return Number.isNaN(entrada.getTime()) ? null : entrada;
  }

  if (typeof entrada !== "string" || entrada.trim() === "") {
    return null;
  }

  if (SOLO_FECHA.test(entrada)) {
    const [anio, mes, dia] = entrada.split("-").map(Number);
    return new Date(anio, mes - 1, dia);
  }

  const valor = new Date(entrada);
  return Number.isNaN(valor.getTime()) ? null : valor;
}

/** S/ 50.00 */
export function formatearMonto(monto: string | number): string {
  const valor = typeof monto === "string" ? Number.parseFloat(monto) : monto;

  if (typeof monto !== "number" && typeof monto !== "string") {
    return "S/ —";
  }

  if (Number.isNaN(valor)) {
    return "S/ —";
  }

  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

/** 20/10/2026 */
export function formatearFecha(fecha: string | Date): string {
  const valor = aFecha(fecha);

  if (!valor) {
    return "—";
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: ZONA,
  }).format(valor);
}

/** 18:00 */
export function formatearHora(fecha: string | Date): string {
  const valor = aFecha(fecha);

  if (!valor) {
    return "—";
  }

  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: ZONA,
  }).format(valor);
}
