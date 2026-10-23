import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FormularioCategoria } from "@/features/categorias/FormularioCategoria";
import { ListaCategorias } from "@/features/categorias/ListaCategorias";
import { ModalConfirmarBorrado } from "@/features/categorias/ModalConfirmarBorrado";
import { ApiError } from "@/lib/api";
import type { Categoria } from "@/features/categorias/api";

if (typeof HTMLDialogElement !== "undefined" && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
}
if (typeof HTMLDialogElement !== "undefined" && !HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
}

describe("FormularioCategoria", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("no envía si el nombre está vacío", async () => {
    const alCrear = vi.fn().mockResolvedValue(undefined);
    render(<FormularioCategoria alCrear={alCrear} creando={false} />);

    fireEvent.click(screen.getByRole("button", { name: /añadir categoría/i }));

    await waitFor(() => {
      expect(screen.getByText("Escribe el nombre de la categoría")).toBeTruthy();
    });

    expect(alCrear).not.toHaveBeenCalled();
  });

  it("rechaza nombres de más de 60 caracteres", async () => {
    const alCrear = vi.fn().mockResolvedValue(undefined);
    render(<FormularioCategoria alCrear={alCrear} creando={false} />);

    fireEvent.change(screen.getByLabelText(/nombre de la categoría/i), {
      target: { value: "x".repeat(61) },
    });
    fireEvent.click(screen.getByRole("button", { name: /añadir categoría/i }));

    await waitFor(() => {
      expect(screen.getByText("El nombre puede tener hasta 60 caracteres")).toBeTruthy();
    });

    expect(alCrear).not.toHaveBeenCalled();
  });

  it("crea la categoría y limpia el formulario", async () => {
    const alCrear = vi.fn().mockResolvedValue(undefined);
    render(<FormularioCategoria alCrear={alCrear} creando={false} />);

    fireEvent.change(screen.getByLabelText(/nombre de la categoría/i), {
      target: { value: "Ramos" },
    });
    fireEvent.click(screen.getByRole("button", { name: /añadir categoría/i }));

    await waitFor(() => {
      expect(alCrear).toHaveBeenCalledWith("Ramos");
    });

    await waitFor(() => {
      expect((screen.getByLabelText(/nombre de la categoría/i) as HTMLInputElement).value).toBe("");
    });
  });

  it("muestra el error 409 bajo el campo", async () => {
    const alCrear = vi
      .fn()
      .mockRejectedValue(
        new ApiError({ statusCode: 409, message: "Ya existe", errores: { nombre: "Ya existe" } }),
      );
    render(<FormularioCategoria alCrear={alCrear} creando={false} />);

    fireEvent.change(screen.getByLabelText(/nombre de la categoría/i), {
      target: { value: "Flores" },
    });
    fireEvent.click(screen.getByRole("button", { name: /añadir categoría/i }));

    await waitFor(() => {
      expect(screen.getByText("Ya existe")).toBeTruthy();
    });
  });

  it("muestra el error genérico si no hay errores por campo", async () => {
    const alCrear = vi.fn().mockRejectedValue(new ApiError({ statusCode: 500, message: "Fallo" }));
    render(<FormularioCategoria alCrear={alCrear} creando={false} />);

    fireEvent.change(screen.getByLabelText(/nombre de la categoría/i), {
      target: { value: "Flores" },
    });
    fireEvent.click(screen.getByRole("button", { name: /añadir categoría/i }));

    await waitFor(() => {
      expect(screen.getByText("Fallo")).toBeTruthy();
    });
  });
});

describe("ListaCategorias", () => {
  const categorias: Categoria[] = [
    { id: "1", nombre: "Ramos", slug: "ramos", cantidadProductos: 2 },
    { id: "2", nombre: "Plantas", slug: "plantas", cantidadProductos: 1 },
  ];

  it("muestra las categorías con la cantidad de productos", () => {
    const alRenombrar = vi.fn();
    const alPedirBorrar = vi.fn();
    render(
      <ListaCategorias
        categorias={categorias}
        alRenombrar={alRenombrar}
        renombrandoId={null}
        alPedirBorrar={alPedirBorrar}
      />,
    );

    expect(screen.getByText("Ramos")).toBeTruthy();
    expect(screen.getByText("2 productos")).toBeTruthy();
    expect(screen.getByText("Plantas")).toBeTruthy();
    expect(screen.getByText("1 producto")).toBeTruthy();
  });

  it("permite renombrar y muestra error bajo el campo", async () => {
    const alRenombrar = vi
      .fn()
      .mockRejectedValue(
        new ApiError({ statusCode: 409, message: "Ya existe", errores: { nombre: "Ya existe" } }),
      );
    const alPedirBorrar = vi.fn();
    render(
      <ListaCategorias
        categorias={categorias}
        alRenombrar={alRenombrar}
        renombrandoId={null}
        alPedirBorrar={alPedirBorrar}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /renombrar/i })[0]);
    const input = screen.getByDisplayValue("Ramos");
    fireEvent.change(input, { target: { value: "Ramos2" } });
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

    await waitFor(() => {
      expect(alRenombrar).toHaveBeenCalledWith("1", "Ramos2");
    });

    await waitFor(() => {
      expect(screen.getByText("Ya existe")).toBeTruthy();
    });
  });

  it("llama alPedirBorrar al pulsar borrar", () => {
    const alRenombrar = vi.fn();
    const alPedirBorrar = vi.fn();
    render(
      <ListaCategorias
        categorias={categorias}
        alRenombrar={alRenombrar}
        renombrandoId={null}
        alPedirBorrar={alPedirBorrar}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /borrar/i })[0]);
    expect(alPedirBorrar).toHaveBeenCalledWith(categorias[0]);
  });

  it("muestra mensaje cuando no hay categorías", () => {
    const alRenombrar = vi.fn();
    const alPedirBorrar = vi.fn();
    render(
      <ListaCategorias
        categorias={[]}
        alRenombrar={alRenombrar}
        renombrandoId={null}
        alPedirBorrar={alPedirBorrar}
      />,
    );

    expect(screen.getByText(/aún no hay categorías/i)).toBeTruthy();
  });
});

describe("ModalConfirmarBorrado", () => {
  const categoria: Categoria = { id: "1", nombre: "Ramos", slug: "ramos", cantidadProductos: 2 };

  it("muestra los productos afectados y llama al confirmar", () => {
    const alCerrar = vi.fn();
    const alConfirmar = vi.fn();
    render(
      <ModalConfirmarBorrado
        categoria={categoria}
        abierto={true}
        borrando={false}
        alCerrar={alCerrar}
        alConfirmar={alConfirmar}
      />,
    );

    expect(screen.getByText(/borrar «ramos»/i)).toBeTruthy();
    expect(screen.getByText(/2 productos/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /borrar categoría/i }));
    expect(alConfirmar).toHaveBeenCalled();
  });

  it("indica que no hay productos si la cantidad es 0", () => {
    const alCerrar = vi.fn();
    const alConfirmar = vi.fn();
    const vacia: Categoria = { ...categoria, cantidadProductos: 0 };
    render(
      <ModalConfirmarBorrado
        categoria={vacia}
        abierto={true}
        borrando={false}
        alCerrar={alCerrar}
        alConfirmar={alConfirmar}
      />,
    );

    expect(screen.getByText(/no tiene productos/i)).toBeTruthy();
  });
});
