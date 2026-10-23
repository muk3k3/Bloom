"use client";

import { useEffect, useRef } from "react";
import { Categoria } from "./api";

interface Props {
  categoria: Categoria | null;
  abierto: boolean;
  borrando: boolean;
  alCerrar: () => void;
  alConfirmar: () => void;
}

/**
 * Confirmación de borrado.
 *
 * El spec exige nombrar los productos afectados. Con `cantidadProductos` ya
 * viene en el listado: si hay productos, se deja claro que seguirán activos
 * pero sin categoría (exactamente lo que hace el servidor).
 */
export function ModalConfirmarBorrado({
  categoria,
  abierto,
  borrando,
  alCerrar,
  alConfirmar,
}: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (abierto) {
      dialogo.current?.showModal();
    } else {
      dialogo.current?.close();
    }
  }, [abierto]);

  if (!categoria) {
    return null;
  }

  const hayProductos = categoria.cantidadProductos > 0;

  return (
    <dialog
      ref={dialogo}
      className="bg-superficie rounded-2xl border border-linea p-0 shadow-lg backdrop:bg-negro/40"
      onCancel={(e) => {
        e.preventDefault();
        if (!borrando) {
          alCerrar();
        }
      }}
    >
      <div className="max-w-md p-6">
        <h2 className="font-display text-texto text-xl font-semibold">
          Borrar «{categoria.nombre}»
        </h2>
        <p className="text-texto-suave mt-2 text-sm">
          {hayProductos
            ? `Esta categoría tiene ${categoria.cantidadProductos} ${
                categoria.cantidadProductos === 1 ? "producto" : "productos"
              }. Al borrarla, quedarán activos y visibles en el catálogo, pero sin categoría.`
            : "Esta categoría no tiene productos."}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={alCerrar}
            disabled={borrando}
            className="border-linea text-texto hover:bg-fondo rounded-lg border px-4 py-2 text-sm transition-colors disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={alConfirmar}
            disabled={borrando}
            className="bg-error hover:bg-error/90 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60"
          >
            {borrando ? "Borrando..." : "Borrar categoría"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
