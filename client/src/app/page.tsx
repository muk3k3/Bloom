/**
 * Página de prueba de T3.
 *
 * Existe para comprobar visualmente que los tokens funcionan: tipografías,
 * colores y sombras. Se reemplaza por el catálogo real en T13.
 */

const COLORES = [
  ["rosa-50", "bg-rosa-50"],
  ["rosa-600", "bg-rosa-600"],
  ["rosa-700", "bg-rosa-700"],
  ["hoja-600", "bg-hoja-600"],
  ["tierra-500", "bg-tierra-500"],
  ["superficie", "bg-superficie border border-linea"],
  ["whatsapp-oscuro", "bg-whatsapp-oscuro"],
] as const;

export default function Pagina() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-texto-suave text-sm">Floristería de barrio · Lima</p>

      <h1 className="font-display text-rosa-700 mt-2 text-4xl font-semibold">
        Bloom, y el catálogo va a tomar forma
      </h1>

      <p className="mt-4 text-texto-suave text-base">
        Esta página existe para revisar los tokens de diseño. Los colores salen de{" "}
        <code className="bg-rosa-50 text-rosa-700 rounded px-1.5 py-0.5">globals.css</code>, no de
        valores sueltos.
      </p>

      <h2 className="font-display mt-12 text-2xl font-semibold">Colores de marca</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {COLORES.map(([nombre, clases]) => (
          <div key={nombre} className={`${clases} rounded-xl h-20 shadow-tarjeta`} />
        ))}
      </div>

      <h2 className="font-display mt-12 text-2xl font-semibold">Botones</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        <button className="h-11 rounded-lg bg-rosa-600 px-6 text-white transition-colors hover:bg-rosa-700">
          Cotizar por WhatsApp
        </button>
        <button className="h-11 rounded-lg border border-linea bg-superficie px-6 text-texto">
          Secundario
        </button>
        <button className="h-11 rounded-full bg-whatsapp-oscuro px-6 text-white">WhatsApp</button>
      </div>

      <h2 className="font-display mt-12 text-2xl font-semibold">Estados</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-exito-fondo text-exito px-3 py-1 text-sm font-medium">
          Guardado
        </span>
        <span className="rounded-full bg-alerta-fondo text-alerta px-3 py-1 text-sm font-medium">
          Oculto
        </span>
        <span className="rounded-full bg-error-fondo text-error px-3 py-1 text-sm font-medium">
          Error
        </span>
        <span className="rounded-full bg-info-fondo text-info px-3 py-1 text-sm font-medium">
          Info
        </span>
      </div>

      <h2 className="font-display mt-12 text-2xl font-semibold">Tarjeta</h2>
      <div className="bg-superficie border-linea rounded-2xl mt-4 border p-6 shadow-tarjeta">
        <h3 className="font-display text-xl font-semibold">Ramo de rosas rojas</h3>
        <p className="text-texto-suave mt-2 text-sm">
          Doce rosas rojas de tallo largo, envueltas en papel kraft.
        </p>
        <p className="tabular-nums text-rosa-600 mt-4 text-xl font-semibold">S/ 85.00</p>
      </div>
    </main>
  );
}
