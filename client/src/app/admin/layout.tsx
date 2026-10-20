"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSesion } from "@/features/auth/useSesion";

/**
 * Protección del panel.
 *
 * `children` no se renderiza hasta saber quién eres. Mientras la pregunta
 * sigue en el aire, no se muestra nada: no es que el contenido esté oculto
 * con CSS, es que nunca llegó a existir en el HTML.
 *
 * El `montado` no es decorativo. Este layout se renderiza también en el
 * servidor, donde la cookie no viaja y /auth/yo siempre respondería 401. Sin
 * ese gate, el servidor pintaría la pantalla de "redirigiendo" y el navegador
 * la repintaría con datos reales — un parpadeo y un warning de hidratación.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [montado, setMontado] = useState(false);
  const { data, isLoading, error } = useSesion();

  useEffect(() => {
    setMontado(true);
  }, []);

  // Sin sesión → al login. replace, no push: no queremos que el botón "atrás"
  // del navegador devuelva a una pantalla que no puede mostrar nada.
  useEffect(() => {
    if (error) {
      router.replace("/ingresar");
    }
  }, [error, router]);

  // Mientras no sepamos quién es, no se renderiza nada. `!data` cubre el
  // caso de que la query termine sin sesión ni error explícito.
  if (!montado || isLoading || !data) {
    return <PantallaDeCarga />;
  }

  return <>{children}</>;
}

function PantallaDeCarga() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center">
      <div
        role="status"
        className="bg-rosa-500/15 h-8 w-8 animate-pulse rounded-full"
        aria-label="Cargando"
      />
    </main>
  );
}
