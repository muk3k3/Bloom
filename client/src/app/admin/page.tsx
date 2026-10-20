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
            {salir.isPending ? "Saliendo…" : "Cerrar sesión"}
          </button>
        </header>

        {/* Marcador de T6/T7: acá va el CRUD del catálogo */}
        <div className="border-linea text-texto-apagado rounded-lg border border-dashed px-5 py-10 text-center text-sm">
          El catálogo se construye en las próximas tareas.
        </div>
      </div>
    </main>
  );
}
