"use client";

import Link from "next/link";
import { useState } from "react";
import { Categoria } from "@/features/categorias/api";
import { FormularioCategoria } from "@/features/categorias/FormularioCategoria";
import { ListaCategorias } from "@/features/categorias/ListaCategorias";
import { ModalConfirmarBorrado } from "@/features/categorias/ModalConfirmarBorrado";
import {
  useBorrarCategoria,
  useCategorias,
  useCrearCategoria,
  useRenombrarCategoria,
} from "@/features/categorias/useCategorias";
import { ApiError } from "@/lib/api";

export default function PaginaCategorias() {
  const { data: categorias = [], isLoading, isError } = useCategorias();
  const crear = useCrearCategoria();
  const renombrar = useRenombrarCategoria();
  const borrar = useBorrarCategoria();

  const [categoriaABorrar, setCategoriaABorrar] = useState<Categoria | null>(null);

  async function alCrear(nombre: string) {
    await crear.mutateAsync(nombre);
  }

  async function alRenombrar(id: string, nombre: string) {
    await renombrar.mutateAsync({ id, nombre });
  }

  async function alConfirmarBorrar() {
    if (!categoriaABorrar) {
      return;
    }
    try {
      await borrar.mutateAsync(categoriaABorrar.id);
      setCategoriaABorrar(null);
    } catch (e) {
      // Si falla, dejamos el modal abierto; el listado ya invalida al éxito.
      if (e instanceof ApiError && e.errores.nombre) {
        // Teóricamente no pasa en DELETE, pero el cliente es defensivo.
      }
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-texto-apagado text-sm">
            <Link href="/admin" className="hover:text-rosa-700 transition-colors">
              Panel
            </Link>{" "}
            / Categorías
          </p>
          <h1 className="font-display text-rosa-700 mt-2 text-3xl font-semibold">Categorías</h1>
          <p className="text-texto-suave mt-1 text-sm">
            Organiza el catálogo. Borrar una categoría no elimina los productos.
          </p>
        </div>
      </header>

      <section className="bg-superficie shadow-tarjeta mt-8 rounded-2xl border border-linea p-6">
        <h2 className="text-texto text-lg font-semibold">Añadir categoría</h2>
        <div className="mt-4">
          <FormularioCategoria alCrear={alCrear} creando={crear.isPending} />
        </div>
      </section>

      <section className="bg-superficie shadow-tarjeta mt-6 rounded-2xl border border-linea p-6">
        <h2 className="text-texto text-lg font-semibold">Listado</h2>
        <div className="mt-4">
          {isLoading && <p className="text-texto-apagado text-sm">Cargando categorías...</p>}
          {isError && (
            <p className="text-error text-sm">
              No se pudieron cargar las categorías. Inténtalo de nuevo.
            </p>
          )}
          {!isLoading && !isError && (
            <ListaCategorias
              categorias={categorias}
              alRenombrar={alRenombrar}
              renombrandoId={renombrar.isPending ? (renombrar.variables?.id ?? null) : null}
              alPedirBorrar={setCategoriaABorrar}
            />
          )}
        </div>
      </section>

      <ModalConfirmarBorrado
        categoria={categoriaABorrar}
        abierto={categoriaABorrar !== null}
        borrando={borrar.isPending}
        alCerrar={() => setCategoriaABorrar(null)}
        alConfirmar={alConfirmarBorrar}
      />
    </main>
  );
}
