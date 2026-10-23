"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Categoria, categoriasApi } from "./api";

const CLAVE = ["categorias"] as const;

/** Lista de categorías con la cantidad de productos. */
export function useCategorias() {
  return useQuery<Categoria[]>({
    queryKey: CLAVE,
    queryFn: categoriasApi.listar,
  });
}

/** Crea una categoría y refresca la lista. */
export function useCrearCategoria() {
  const consulta = useQueryClient();

  return useMutation({
    mutationFn: (nombre: string) => categoriasApi.crear({ nombre }),
    onSuccess: () => {
      consulta.invalidateQueries({ queryKey: CLAVE });
    },
  });
}

/** Renombra una categoría y refresca la lista. */
export function useRenombrarCategoria() {
  const consulta = useQueryClient();

  return useMutation({
    mutationFn: ({ id, nombre }: { id: string; nombre: string }) =>
      categoriasApi.renombrar(id, { nombre }),
    onSuccess: () => {
      consulta.invalidateQueries({ queryKey: CLAVE });
    },
  });
}

/** Borra una categoría y refresca la lista. */
export function useBorrarCategoria() {
  const consulta = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoriasApi.borrar(id),
    onSuccess: () => {
      consulta.invalidateQueries({ queryKey: CLAVE });
    },
  });
}
