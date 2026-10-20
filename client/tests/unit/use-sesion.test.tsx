import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useIngresar, useSalir, useSesion } from "@/features/auth/useSesion";

function responder(cuerpo: unknown, init: { ok?: boolean; status?: number } = {}): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => cuerpo,
  } as Response;
}

let cliente: QueryClient;

function conQuery(children: ReactNode) {
  cliente = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={cliente}>{children}</QueryClientProvider>;
}

/** Monta el hook de salida sobre un botón. */
function BotonSalir() {
  const salir = useSalir();
  return (
    <button type="button" onClick={() => salir.mutate()}>
      Salir
    </button>
  );
}

/** Monta el hook de ingreso y deja el resultado a mano. */
function BotonIngresar() {
  const ingresar = useIngresar();
  return (
    <button
      type="button"
      onClick={() => ingresar.mutate({ email: "dueno@bloom.local", password: "Bloom2026!" })}
    >
      Entrar
    </button>
  );
}

describe("useSesion", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("pregunta quién soy con credentials: include", async () => {
    vi.mocked(fetch).mockResolvedValue(responder({ email: "dueno@bloom.local" }));

    function QuienSoy() {
      const { data } = useSesion();
      return <p>{data?.email ?? "nadie"}</p>;
    }

    render(conQuery(<QuienSoy />));

    await waitFor(() => {
      expect(screen.getByText("dueno@bloom.local")).toBeTruthy();
    });

    const [url, opciones] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("/api/auth/yo");
    expect((opciones as RequestInit).credentials).toBe("include");
  });
});

describe("useIngresar", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("al terminar vuelve a preguntar al servidor, en vez de confiar en la respuesta del login", async () => {
    // El login responde OK pero NO dice el correo: solo /auth/yo lo sabe.
    vi.mocked(fetch).mockImplementation(async (ruta) => {
      if (String(ruta).endsWith("/auth/ingresar")) {
        return responder({ mensaje: "Sesión iniciada" });
      }
      return responder({ email: "dueno@bloom.local" });
    });

    // Hay que montar useSesion también: invalidateQueries no refetchea una
    // query que nadie está mirando, y ese es justo el comportamiento que
    // queremos probar.
    function Pantalla() {
      const { data } = useSesion();
      return (
        <>
          <p>{data?.email ?? "sin sesión"}</p>
          <BotonIngresar />
        </>
      );
    }

    render(conQuery(<Pantalla />));

    // Todavía no hay sesión.
    expect(screen.getByText("sin sesión")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(screen.getByText("dueno@bloom.local")).toBeTruthy();
    });

    expect(vi.mocked(fetch).mock.calls.map((c) => String(c[0]))).toEqual([
      "/api/auth/yo",
      "/api/auth/ingresar",
      "/api/auth/yo",
    ]);
  });
});

describe("useSalir", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("cierra sesión y borra la caché de la sesión", async () => {
    vi.mocked(fetch).mockResolvedValue(responder({ mensaje: "Sesión cerrada" }));

    render(conQuery(<BotonSalir />));

    // Sembramos la caché como si ya hubiéramos estado dentro.
    act(() => {
      cliente.setQueryData(["sesion"], { email: "dueno@bloom.local" });
    });

    fireEvent.click(screen.getByRole("button", { name: "Salir" }));

    await waitFor(() => {
      expect(cliente.getQueryData(["sesion"])).toBeUndefined();
    });

    const [url, opciones] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("/api/auth/salir");
    expect((opciones as RequestInit).method).toBe("POST");
  });
});
