"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * Proveedores del cliente.
 *
 * Va aparte del layout porque el layout es un Server Component, y un
 * QueryClient (que es una clase) no puede cruzar de servidor a cliente.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // El panel del propietario siempre lee fresco: el dueño tiene que
            // ver su cambio al instante. El catálogo público usa su propia
            // caché por ISR en el servidor, no esta.
            staleTime: 0,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
