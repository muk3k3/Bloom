import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FormularioIngreso } from "@/features/auth/FormularioIngreso";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

/** Respuesta mínima que devuelve fetch. */
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

function escribir(campo: "Correo" | "Contraseña", valor: string) {
  fireEvent.change(screen.getByLabelText(campo), { target: { value: valor } });
}

async function enviar() {
  fireEvent.click(screen.getByRole("button", { name: /entrar al panel/i }));
}

describe("FormularioIngreso", () => {
  let push: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      push,
      refresh: vi.fn(),
      replace: vi.fn(),
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

  it("no envía nada si los campos están vacíos", async () => {
    render(conQuery(<FormularioIngreso />));

    await enviar();

    // El error va debajo de su campo, con su id para lectores de pantalla.
    await waitFor(() => {
      expect(screen.getByText("Escribe tu correo")).toBeTruthy();
      expect(screen.getByText("Escribe tu contraseña")).toBeTruthy();
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it("rechaza un correo que no parece correo", async () => {
    render(conQuery(<FormularioIngreso />));

    escribir("Correo", "no-es-un-correo");
    // Dispara la validación al salir del campo.
    screen.getByLabelText("Contraseña").focus();
    fireEvent.blur(screen.getByLabelText("Correo"));

    await waitFor(() => {
      expect(screen.getByText("Ese correo no parece válido")).toBeTruthy();
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it("marca los campos inválidos con aria-invalid", async () => {
    render(conQuery(<FormularioIngreso />));

    await enviar();

    await waitFor(() => {
      expect(screen.getByLabelText("Correo").getAttribute("aria-invalid")).toBe("true");
    });
  });

  it("ingresa y navega al panel con credenciales correctas", async () => {
    vi.mocked(fetch).mockResolvedValue(responder({ mensaje: "Sesión iniciada" }));

    render(conQuery(<FormularioIngreso />));

    escribir("Correo", "dueno@bloom.local");
    escribir("Contraseña", "Bloom2026!");
    await enviar();

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/admin");
    });

    // La cookie la pone el servidor con Set-Cookie: el navegador la guarda
    // sola. No hay nada que el cliente deba hacer con ella aquí.
    const [url, opciones] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("/api/auth/ingresar");
    expect((opciones as RequestInit).method).toBe("POST");
    expect((opciones as RequestInit).credentials).toBe("include");
  });

  it("muestra el 401 en línea y NO navega", async () => {
    vi.mocked(fetch).mockResolvedValue(
      responder(
        { statusCode: 401, message: "Correo o contraseña incorrectos" },
        { ok: false, status: 401 },
      ),
    );

    render(conQuery(<FormularioIngreso />));

    escribir("Correo", "dueno@bloom.local");
    escribir("Contraseña", "mala");
    await enviar();

    // role="alert" para que un lector de pantalla lo anuncie de inmediato.
    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain("Correo o contraseña incorrectos");
    });

    expect(push).not.toHaveBeenCalled();
  });

  it("mapea los errores por campo que manda el server a su campo", async () => {
    vi.mocked(fetch).mockResolvedValue(
      responder(
        {
          statusCode: 400,
          message: "Error de validación",
          errores: { email: "Ese correo ya está en uso" },
        },
        { ok: false, status: 400 },
      ),
    );

    render(conQuery(<FormularioIngreso />));

    escribir("Correo", "dueno@bloom.local");
    escribir("Contraseña", "Bloom2026!");
    await enviar();

    await waitFor(() => {
      expect(screen.getByText("Ese correo ya está en uso")).toBeTruthy();
    });

    // El error general no debe aparecer si ya hay detalle por campo.
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it('distingue "no se pudo conectar" de "credenciales malas"', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));

    render(conQuery(<FormularioIngreso />));

    escribir("Correo", "dueno@bloom.local");
    escribir("Contraseña", "Bloom2026!");
    await enviar();

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain("No se pudo conectar");
    });
  });

  it("el botón se deshabilita mientras se envía", async () => {
    vi.mocked(fetch).mockResolvedValue(responder({ mensaje: "ok" }));

    render(conQuery(<FormularioIngreso />));

    escribir("Correo", "dueno@bloom.local");
    escribir("Contraseña", "Bloom2026!");
    await enviar();

    const boton = screen.getByRole("button", { name: /entrando/i });
    expect(boton.hasAttribute("disabled")).toBe(true);

    await waitFor(() => {
      expect(push).toHaveBeenCalled();
    });
  });
});
