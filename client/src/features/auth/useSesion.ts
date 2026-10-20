"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, Credenciales, Sesion } from "./api";

/**
 * La sesión actual.
 *
 * `retry: false` es importante: un 401 no es un error transitorio, es la
 * respuesta. Reintentarlo solo añadiría medio segundo de espera antes de
 * mandarte al login.
 */
export function useSesion() {
  return useQuery<Sesion>({
    queryKey: ["sesion"],
    queryFn: authApi.yo,
    retry: false,
    staleTime: 60_000,
  });
}

/**
 * Inicia sesión.
 *
 * No escribe la caché a mano: al terminar, el formulario invalida la query de
 * sesión y esta vuelve a preguntarle al servidor. Si el servidor no está de
 * acuerdo, no hay sesión — así no se puede quedar una pantalla creyendo que
 * estás dentro cuando ya no.
 */
export function useIngresar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credenciales: Credenciales) => authApi.ingresar(credenciales),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sesion"] });
    },
  });
}

/**
 * Cierra sesión y limpia la caché.
 *
 * La limpieza importa: sin ella, al cerrar sesión en una pestaña la otra
 * seguiría mostrando los datos del propietario hasta que react-query decidiera
 * volver a preguntar.
 */
export function useSalir() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.salir(),
    onSuccess: () => {
      queryClient.setQueryData(["sesion"], undefined);
      queryClient.removeQueries({ queryKey: ["sesion"] });
    },
  });
}
