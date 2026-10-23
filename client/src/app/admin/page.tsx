"use client";

import { useRouter } from "next/navigation";
import { useSalir, useSesion } from "@/features/auth/useSesion";

/**
 * Panel del propietario.
 *
 * Por ahora es un marcador: valida de punta a punta que la sesión se sostiene
 * sola (cookie httpOnly → guard → pantalla) y que se puede salir. El catálogo
 * real llega en T6/T7.
 */
export default function PaginaAdmin() {
  const router = useRouter();
  const { data } = useSesion();
  const salir = useSalir();

  async function alSalir() {
    await salir.mutateAsync();
    router.replace("/ingresar");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="bg-superficie shadow-tarjeta flex flex-col gap-6 rounded-2xl border border-linea p-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-rosa-700 text-3xl font-semibold">Panel</h1>
            <p className="text-texto-suave mt-1 text-sm">
              Hola, <span className="text-texto font-medium">{data?.email}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={alSalir}
            disabled={salir.isPending}
            className="border-linea text-texto hover:bg-error-fondo hover:border-error/30 hover:text-error rounded-lg border px-4 py-2 text-sm transition-colors disabled:opacity-60"
          >
            {salir.isPending ? "Saliendo..." : "Cerrar sesión"}
          </button>
        </header>

        <div className="border-linea flex flex-col gap-3 rounded-lg border px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-texto font-medium">Categorías</p>
            <p className="text-texto-apagado text-sm">
              Añade, renombra o borra categorías del catálogo.
            </p>
          </div>
          <a
            href="/admin/categorias"
            className="bg-rosa-600 hover:bg-rosa-700 focus-visible:ring-rosa-500 rounded-lg px-4 py-2 text-center text-sm font-medium text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            Gestionar categorías
          </a>
        </div>
      </div>
    </main>
  );
}
