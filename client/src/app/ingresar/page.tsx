import type { Metadata } from "next";
import { FormularioIngreso } from "@/features/auth/FormularioIngreso";

export const metadata: Metadata = {
  title: "Ingresar · Bloom",
  // No indexar: no tiene sentido que un motor de búsqueda la encuentre, y
  // menos que la muestre en los resultados.
  robots: { index: false, follow: false },
};

export default function PaginaIngresar() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <header className="mb-8 text-center">
          <h1 className="font-display text-rosa-700 text-3xl font-semibold">Bloom</h1>
          <p className="text-texto-suave mt-1 text-sm">Panel del propietario</p>
        </header>

        <FormularioIngreso />

        <p className="text-texto-apagado mt-6 text-center text-xs">
          Solo el propietario tiene acceso a esta zona.
        </p>
      </div>
    </main>
  );
}
