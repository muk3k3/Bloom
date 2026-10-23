"use client";

import { useState } from "react";
import { Categoria } from "./api";
import { ApiError } from "@/lib/api";

interface Props {
  categorias: Categoria[];
  alRenombrar: (id: string, nombre: string) => Promise<void>;
  renombrandoId: string | null;
  alPedirBorrar: (categoria: Categoria) => void;
}

/**
 * Lista con renombrado inline.
 *
 * Al editar, el error 409 (nombre repetido) se muestra bajo el campo en
 * edición, no como toast. Eso cubre el criterio de que el 409 aparezca
 * bajo el campo nombre.
 */
export function ListaCategorias({ categorias, alRenombrar, renombrandoId, alPedirBorrar }: Props) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nombreEditado, setNombreEditado] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function empezarEditar(categoria: Categoria) {
    setEditandoId(categoria.id);
    setNombreEditado(categoria.nombre);
    setError(null);
  }

  function cancelar() {
    setEditandoId(null);
    setNombreEditado("");
    setError(null);
  }

  async function guardar(id: string) {
    const nombre = nombreEditado.trim();
    if (nombre.length === 0) {
      setError("Escribe el nombre de la categoría");
      return;
    }
    if (nombre.length > 60) {
      setError("El nombre puede tener hasta 60 caracteres");
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      await alRenombrar(id, nombre);
      cancelar();
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.errores.nombre) {
          setError(e.errores.nombre);
          return;
        }
        setError(e.message);
        return;
      }
      setError("Algo salió mal. Inténtalo de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  if (categorias.length === 0) {
    return (
      <p className="text-texto-apagado py-6 text-center text-sm">
        Aún no hay categorías. Añade la primera desde el formulario.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-linea">
      {categorias.map((categoria) => {
        const editando = editandoId === categoria.id;
        const renombrando = renombrandoId === categoria.id;
        const deshabilitado = guardando || renombrando;

        return (
          <li
            key={categoria.id}
            className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            {editando ? (
              <div className="flex-1">
                <input
                  type="text"
                  value={nombreEditado}
                  onChange={(e) => setNombreEditado(e.target.value)}
                  disabled={guardando}
                  aria-invalid={error ? true : undefined}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-1 sm:max-w-sm ${
                    error
                      ? "border-error focus-visible:ring-error"
                      : "border-linea focus-visible:ring-rosa-500"
                  } disabled:opacity-60`}
                  autoFocus
                />
                {error && <p className="text-error mt-1 text-sm">{error}</p>}
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => guardar(categoria.id)}
                    disabled={guardando}
                    className="bg-rosa-600 hover:bg-rosa-700 rounded-lg px-3 py-1.5 text-sm text-white disabled:opacity-60"
                  >
                    {guardando ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelar}
                    disabled={guardando}
                    className="border-linea text-texto hover:bg-fondo rounded-lg border px-3 py-1.5 text-sm disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-baseline justify-between gap-4 sm:justify-start">
                  <span className="text-texto font-medium">{categoria.nombre}</span>
                  <span className="text-texto-apagado text-sm">
                    {categoria.cantidadProductos}{" "}
                    {categoria.cantidadProductos === 1 ? "producto" : "productos"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => empezarEditar(categoria)}
                    disabled={deshabilitado}
                    className="border-linea text-texto hover:bg-fondo rounded-lg border px-3 py-1.5 text-sm disabled:opacity-60"
                  >
                    Renombrar
                  </button>
                  <button
                    type="button"
                    onClick={() => alPedirBorrar(categoria)}
                    disabled={deshabilitado}
                    className="border-linea text-texto hover:bg-error-fondo hover:border-error/30 hover:text-error rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:opacity-60"
                  >
                    Borrar
                  </button>
                </div>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
