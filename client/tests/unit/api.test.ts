import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, api, whatsappDe } from "@/lib/api";

/** Respuesta minima que devuelve fetch. */
function responder(cuerpo: unknown, init: { ok?: boolean; status?: number } = {}): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => cuerpo,
  } as Response;
}

/**
 * Ejecuta la llamada y devuelve el ApiError que debería lanzar.
 * Si no lanza, el test falla con un mensaje claro en vez de un error de tipo.
 */
async function capturarError(promesa: Promise<unknown>): Promise<ApiError> {
  try {
    await promesa;
  } catch (error) {
    return error as ApiError;
  }
  throw new Error("Se esperaba un ApiError y la llamada no falló");
}

describe("api", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("devuelve el cuerpo parseado", async () => {
    vi.mocked(fetch).mockResolvedValue(responder({ nombre: "Ramo de rosas" }));

    const resultado = await api.get<{ nombre: string }>("/productos");

    expect(resultado).toEqual({ nombre: "Ramo de rosas" });
  });

  it("envía las credenciales para que viaje la cookie de sesión", async () => {
    vi.mocked(fetch).mockResolvedValue(responder({}));

    await api.get("/productos");

    expect(fetch).toHaveBeenCalledWith(
      "/api/productos",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("envía el cuerpo en JSON al crear", async () => {
    vi.mocked(fetch).mockResolvedValue(responder({}, { status: 201 }));

    await api.post("/productos", { nombre: "Ramo" });

    expect(fetch).toHaveBeenCalledWith(
      "/api/productos",
      expect.objectContaining({ method: "POST", body: '{"nombre":"Ramo"}' }),
    );
  });

  it("lanza ApiError con el mensaje del servidor", async () => {
    vi.mocked(fetch).mockResolvedValue(
      responder(
        { statusCode: 409, message: "Ya existe un producto con ese nombre" },
        { ok: false, status: 409 },
      ),
    );

    await expect(api.post("/productos", {})).rejects.toThrow(ApiError);
  });

  it("conserva el mapa de errores por campo", async () => {
    vi.mocked(fetch).mockResolvedValue(
      responder(
        {
          statusCode: 400,
          message: "Datos inválidos",
          errores: { nombre: "El nombre es obligatorio" },
        },
        { ok: false, status: 400 },
      ),
    );

    const error = await capturarError(api.post("/productos", {}));

    expect(error.statusCode).toBe(400);
    expect(error.errores.nombre).toBe("El nombre es obligatorio");
  });

  it("si la respuesta no es JSON, da un mensaje legible", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("no json");
      },
    } as unknown as Response);

    const error = await capturarError(api.get("/productos"));

    expect(error.message).toBe("Algo salió mal. Inténtalo de nuevo.");
    expect(error.errores).toEqual({});
  });

  it("devuelve undefined en un 204", async () => {
    vi.mocked(fetch).mockResolvedValue(responder(null, { status: 204 }));

    await expect(api.delete("/productos/1")).resolves.toBeUndefined();
  });
});

describe("whatsappDe", () => {
  it("arma el enlace con el mensaje codificado", () => {
    const enlace = whatsappDe("51987654321", "Hola, quiero cotizar un ramo");

    expect(enlace).toBe("https://wa.me/51987654321?text=Hola%2C%20quiero%20cotizar%20un%20ramo");
  });

  it("codifica los acentos", () => {
    const enlace = whatsappDe("51987654321", "Cotización de arreglo floral");

    expect(enlace).toContain("Cotizaci%C3%B3n");
  });
});
