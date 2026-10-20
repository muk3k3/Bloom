import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminLayout from "@/app/admin/layout";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

function responder(cuerpo: unknown, init: { ok?: boolean; status?: number } = {}): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => cuerpo,
  } as Response;
}

function conQuery(children: ReactNode) {
  return (
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        })
      }
    >
      {children}
    </QueryClientProvider>
  );
}

describe("AdminLayout", () => {
  let replace: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    replace = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      refresh: vi.fn(),
      replace,
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("redirige al login y NO pinta el panel si no hay sesión", async () => {
    // El endpoint es público en el navegador, pero responde 401 sin cookie.
    vi.mocked(fetch).mockResolvedValue(
      responder(
        { statusCode: 401, message: "Necesitas iniciar sesión" },
        { ok: false, status: 401 },
      ),
    );

    render(
      conQuery(
        <AdminLayout>
          <p>Contenido sensible del propietario</p>
        </AdminLayout>,
      ),
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/ingresar");
    });

    // Lo importante: el contenido jamás llegó al DOM. No está escondido con
    // CSS, simplemente no existe.
    expect(screen.queryByText(/contenido sensible/i)).toBeNull();
  });

  it("pinta el panel cuando hay sesión", async () => {
    vi.mocked(fetch).mockResolvedValue(responder({ email: "dueno@bloom.local" }));

    render(
      conQuery(
        <AdminLayout>
          <p>Contenido sensible del propietario</p>
        </AdminLayout>,
      ),
    );

    await waitFor(() => {
      expect(screen.getByText(/contenido sensible/i)).toBeTruthy();
    });

    expect(replace).not.toHaveBeenCalled();
  });

  it("no muestra el panel mientras la pregunta sigue en el aire", () => {
    // fetch nunca responde: es el estado "cargando".
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}) as unknown as Promise<Response>);

    render(
      conQuery(
        <AdminLayout>
          <p>Contenido sensible del propietario</p>
        </AdminLayout>,
      ),
    );

    expect(screen.queryByText(/contenido sensible/i)).toBeNull();
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("pregunta al servidor exactamente una vez por montaje", async () => {
    vi.mocked(fetch).mockResolvedValue(responder({ email: "dueno@bloom.local" }));

    render(
      conQuery(
        <AdminLayout>
          <p>hola</p>
        </AdminLayout>,
      ),
    );

    await waitFor(() => {
      expect(screen.getByText(/hola/i)).toBeTruthy();
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe("/api/auth/yo");
    expect((vi.mocked(fetch).mock.calls[0][1] as RequestInit).credentials).toBe("include");
  });
});
