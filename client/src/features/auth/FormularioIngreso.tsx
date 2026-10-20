"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ApiError } from "@/lib/api";
import { useIngresar } from "./useSesion";

/**
 * Formulario de ingreso al panel.
 *
 * Regla de diseño (SPEC §5): el error va debajo de su campo, nunca en un
 * toast. Un toast desaparece y deja al usuario sin saber qué hizo mal.
 *
 * La única excepción es el 401. "Correo o contraseña incorrectos" no es
 * atribuible a un campo: decirle al usuario que su contraseña está mal sugiere
 * que el correo sí fue aceptado, y eso es mentira. Va en línea, debajo del
 * botón, y tampoco en un toast.
 */

const esquema = z.object({
  email: z.string().trim().min(1, "Escribe tu correo").email("Ese correo no parece válido"),
  password: z.string().min(1, "Escribe tu contraseña"),
});

type Campos = z.infer<typeof esquema>;

export function FormularioIngreso() {
  const router = useRouter();
  const ingresar = useIngresar();
  // El 401 y los errores de red van aquí, no en un toast.
  const [errorDeServidor, setErrorDeServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Campos>({
    resolver: zodResolver(esquema),
    // Mientras no se toque un campo, no se le reclama nada al usuario.
    mode: "onBlur",
  });

  async function alEnviar(datos: Campos) {
    setErrorDeServidor(null);

    try {
      await ingresar.mutateAsync(datos);
      // Si el servidor no aceptó, mutateAsync lanza y nunca llegamos acá.
      router.push("/admin");
      router.refresh();
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setErrorDeServidor("No se pudo conectar. Revisa que el servidor esté corriendo.");
        return;
      }

      // Si el server mandó errores por campo (validación), van a su campo.
      const campos = Object.keys(error.errores) as (keyof Campos)[];
      if (campos.length > 0) {
        for (const campo of campos) {
          setError(campo, { message: error.errores[campo] });
        }
        return;
      }

      // Credenciales malas, rate limit, cualquier 4xx/5xx sin detalle.
      setErrorDeServidor(error.message);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(alEnviar)}
      noValidate
      className="bg-superficie shadow-tarjeta flex flex-col gap-5 rounded-2xl border border-linea p-8"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-texto text-sm font-medium">
          Correo
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          // autoFocus: cómodo en desktop, molesto en móvil. Solo desktop.
          autoFocus={typeof window !== "undefined" && window.innerWidth >= 768}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "error-email" : undefined}
          className={`rounded-lg border px-3 py-2.5 text-base outline-none transition-colors focus:ring-2 ${
            errors.email
              ? "border-error focus:ring-error/30"
              : "border-linea focus:border-rosa-500 focus:ring-rosa-500/25"
          }`}
          {...register("email")}
        />
        {errors.email && (
          <p id="error-email" className="text-error text-sm">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-texto text-sm font-medium">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "error-password" : undefined}
          className={`rounded-lg border px-3 py-2.5 text-base outline-none transition-colors focus:ring-2 ${
            errors.password
              ? "border-error focus:ring-error/30"
              : "border-linea focus:border-rosa-500 focus:ring-rosa-500/25"
          }`}
          {...register("password")}
        />
        {errors.password && (
          <p id="error-password" className="text-error text-sm">
            {errors.password.message}
          </p>
        )}
      </div>

      {errorDeServidor && (
        <p role="alert" className="bg-error-fondo text-error rounded-lg px-3 py-2.5 text-sm">
          {errorDeServidor}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-rosa-600 hover:bg-rosa-700 focus-visible:ring-rosa-500 mt-1 flex h-11 items-center justify-center rounded-lg text-base font-medium text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {isSubmitting ? "Entrando…" : "Entrar al panel"}
      </button>
    </form>
  );
}
