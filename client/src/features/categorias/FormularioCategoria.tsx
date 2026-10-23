"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ApiError } from "@/lib/api";

const esquema = z.object({
  nombre: z
    .string({ message: "Escribe el nombre de la categoría" })
    .trim()
    .min(1, "Escribe el nombre de la categoría")
    .max(60, "El nombre puede tener hasta 60 caracteres"),
});

type Valores = z.infer<typeof esquema>;

interface Props {
  alCrear: (nombre: string) => Promise<void>;
  creando: boolean;
}

/**
 * Formulario para crear una categoría.
 *
 * El error 409 se pinta debajo del campo, nunca como toast (criterio T7).
 * Cualquier otro error del servidor cae como mensaje genérico.
 */
export function FormularioCategoria({ alCrear, creando }: Props) {
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: { nombre: "" },
  });

  async function onSubmit(valores: Valores) {
    setErrorServidor(null);
    try {
      await alCrear(valores.nombre);
      reset();
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.errores.nombre) {
          setError("nombre", { type: "server", message: e.errores.nombre });
          return;
        }
        setErrorServidor(e.message);
        return;
      }
      setErrorServidor("Algo salió mal. Inténtalo de nuevo.");
    }
  }

  const enviando = creando || isSubmitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="flex-1">
          <label htmlFor="nombre-categoria" className="text-texto mb-1 block text-sm font-medium">
            Nombre de la categoría
          </label>
          <input
            id="nombre-categoria"
            type="text"
            placeholder="Ej.: Ramo romántico"
            autoComplete="off"
            disabled={enviando}
            aria-invalid={errors.nombre ? true : undefined}
            aria-describedby={errors.nombre ? "error-nombre-categoria" : undefined}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 ${
              errors.nombre
                ? "border-error focus-visible:ring-error"
                : "border-linea focus-visible:ring-rosa-500"
            } disabled:opacity-60`}
            {...register("nombre")}
          />
          {errors.nombre && (
            <p id="error-nombre-categoria" className="text-error mt-1 text-sm">
              {errors.nombre.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={enviando}
          aria-busy={enviando}
          className="bg-rosa-600 hover:bg-rosa-700 focus-visible:ring-rosa-500 mt-1 flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 sm:mt-7"
        >
          {enviando ? "Guardando..." : "Añadir categoría"}
        </button>
      </div>

      {errorServidor && (
        <p role="alert" className="bg-error-fondo text-error rounded-lg px-3 py-2 text-sm">
          {errorServidor}
        </p>
      )}
    </form>
  );
}
