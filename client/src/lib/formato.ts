/**
 * Formateo para mostrar datos al cliente.
 *
 * Reglas del proyecto:
 *   · El dinero es `Decimal` en la API y sale con dos decimales, en soles
 *   · Las fechas van dd/mm/aaaa
 *   · Los instantes se muestran en America/Lima (UTC-5), no en la zona de quien mira
 */

const ZONA = "America/Lima";

/** Una fecha sin hora: "2026-10-20" */
const SOLO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

const dosCifras = (valor: number) => String(valor).padStart(2, "0");

/**
 * Parte una fecha sin hora en sus números. Es un día del calendario:
 * no tiene hora ni zona, y no debe moverse.
 */
function partesDeFecha(entrada: string): { anio: number; mes: number; dia: number } | null {
  const [, anio, mes, dia] = entrada.match(/^(\d{4})-(\d{2})-(\d{2})$/) ?? [];

  if (!anio || !mes || !dia) return null;

  return { anio: Number(anio), mes: Number(mes), dia: Number(dia) };
}

/**
 * Convierte un instante a Date, o null si no es válido.
 *
 * Un string con hora ("2026-10-20T18:00:00Z") SÍ es un instante: se convierte
 * a Lima como corresponde.
 */
function aFecha(entrada: string | Date): Date | null {
  if (entrada instanceof Date) {
    return Number.isNaN(entrada.getTime()) ? null : entrada;
  }

  if (typeof entrada !== "string" || entrada.trim() === "") {
    return null;
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

/**
 * 20/10/2026
 *
 * Una fecha sin hora se arma con sus propios números y NO pasa por Date ni por
 * Intl. Si se construyera como medianoche y se formateara en Lima, en una
 * máquina que no está en UTC-5 se mostraría un día antes — que es exactamente
 * lo que pasaba.
 */
export function formatearFecha(fecha: string | Date): string {
  if (typeof fecha === "string" && SOLO_FECHA.test(fecha)) {
    const partes = partesDeFecha(fecha);
    return `${dosCifras(partes!.dia)}/${dosCifras(partes!.mes)}/${partes!.anio}`;
  }

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
