import { ConflictException, NotFoundException } from "@nestjs/common";
import type { PrismaService } from "../../prisma/prisma.service";
import { CategoriesService, NOMBRE_TOMADO } from "./categories.service";

/** Prisma a mano: solo lo que el servicio toca, con valores por defecto. */
function prismaFalso() {
  return {
    categoria: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    producto: {
      count: jest.fn().mockResolvedValue(0),
      // Está en el mock para poder afirmar que NUNCA se usa al borrar.
      deleteMany: jest.fn(),
    },
  };
}

function servicio(prisma = prismaFalso()) {
  return { prisma, categorias: new CategoriesService(prisma as unknown as PrismaService) };
}

describe("CategoriesService.listar", () => {
  it("devuelve la lista con la cantidad de productos de cada una", async () => {
    const { prisma, categorias } = servicio();
    prisma.categoria.findMany.mockResolvedValue([
      { id: "c1", nombre: "Ramos", slug: "ramos", orden: 0, _count: { productos: 3 } },
      { id: "c2", nombre: "Arreglos", slug: "arreglos", orden: 1, _count: { productos: 0 } },
    ]);

    const lista = await categorias.listar();

    expect(lista).toEqual([
      { id: "c1", nombre: "Ramos", slug: "ramos", orden: 0, cantidadProductos: 3 },
      { id: "c2", nombre: "Arreglos", slug: "arreglos", orden: 1, cantidadProductos: 0 },
    ]);
    // Orden estable aunque todas tengan orden 0.
    expect(prisma.categoria.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: [{ orden: "asc" }, { nombre: "asc" }] }),
    );
    expect(lista[0]).not.toHaveProperty("_count");
  });
});

describe("CategoriesService.crear", () => {
  it("guarda el nombre y el slug normalizado del propio nombre", async () => {
    const { prisma, categorias } = servicio();
    prisma.categoria.create.mockResolvedValue({
      id: "c1",
      nombre: "Boda & Amor",
      slug: "boda-y-amor",
      orden: 0,
    });

    const creada = await categorias.crear({ nombre: "Boda & Amor" });

    expect(prisma.categoria.create).toHaveBeenCalledWith({
      data: { nombre: "Boda & Amor", slug: "boda-y-amor" },
    });
    expect(creada).toMatchObject({ slug: "boda-y-amor", cantidadProductos: 0 });
  });

  it("devuelve 409 si el nombre ya existe sin distinguir mayúsculas", async () => {
    const { prisma, categorias } = servicio();
    prisma.categoria.findFirst.mockResolvedValue({ id: "c1", nombre: "Ramos" });

    await expect(categorias.crear({ nombre: "RAMOS" })).rejects.toThrow(ConflictException);

    expect(prisma.categoria.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { nombre: { equals: "RAMOS", mode: "insensitive" } },
      }),
    );
  });

  it("el 409 trae el mensaje por campo, como pide el spec", async () => {
    const { prisma, categorias } = servicio();
    prisma.categoria.findFirst.mockResolvedValue({ id: "c1", nombre: "Ramos" });

    const error = await categorias.crear({ nombre: "ramos" }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ConflictException);
    expect((error as ConflictException).getResponse()).toMatchObject({
      statusCode: 409,
      message: NOMBRE_TOMADO,
      errores: { nombre: NOMBRE_TOMADO },
    });
  });

  it("agrega un sufijo cuando el slug ya está ocupado", async () => {
    const { prisma, categorias } = servicio();
    // 1: revisarNombre → libre. 2: "boda-y-amor" ocupado. 3: "-2" libre.
    prisma.categoria.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "c1", slug: "boda-y-amor" })
      .mockResolvedValueOnce(null);
    prisma.categoria.create.mockResolvedValue({
      id: "c2",
      nombre: "Boda y Amor",
      slug: "boda-y-amor-2",
      orden: 0,
    });

    await categorias.crear({ nombre: "Boda y Amor" });

    expect(prisma.categoria.create).toHaveBeenCalledWith({
      data: { nombre: "Boda y Amor", slug: "boda-y-amor-2" },
    });
  });

  it("convierte un choque de la base en 409 y no en 500", async () => {
    const { prisma, categorias } = servicio();
    prisma.categoria.create.mockRejectedValue({ code: "P2002" });

    await expect(categorias.crear({ nombre: "Ramos" })).rejects.toThrow(ConflictException);
  });

  it("deja pasar cualquier otro error de la base", async () => {
    const { prisma, categorias } = servicio();
    prisma.categoria.create.mockRejectedValue(new Error("se cayó la conexión"));

    await expect(categorias.crear({ nombre: "Ramos" })).rejects.toThrow("se cayó la conexión");
  });
});

describe("CategoriesService.modificar", () => {
  it("renombra y regenera el slug", async () => {
    const { prisma, categorias } = servicio();
    prisma.categoria.findUnique.mockResolvedValue({
      id: "c1",
      nombre: "Ramos",
      slug: "ramos",
      orden: 0,
    });
    prisma.categoria.findFirst.mockResolvedValue(null);
    prisma.categoria.update.mockResolvedValue({
      id: "c1",
      nombre: "Arreglos",
      slug: "arreglos",
      orden: 0,
    });
    prisma.producto.count.mockResolvedValue(2);

    const guardada = await categorias.modificar("c1", { nombre: "Arreglos" });

    expect(prisma.categoria.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { nombre: "Arreglos", slug: "arreglos" },
    });
    expect(guardada).toMatchObject({ slug: "arreglos", cantidadProductos: 2 });
  });

  it("no se considera a sí misma duplicada al guardar sin cambiar el nombre", async () => {
    const { prisma, categorias } = servicio();
    prisma.categoria.findUnique.mockResolvedValue({
      id: "c1",
      nombre: "Ramos",
      slug: "ramos",
      orden: 0,
    });
    prisma.categoria.findFirst.mockResolvedValue(null);
    prisma.categoria.update.mockResolvedValue({
      id: "c1",
      nombre: "Ramos",
      slug: "ramos",
      orden: 0,
    });

    await categorias.modificar("c1", { nombre: "Ramos" });

    expect(prisma.categoria.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: { not: "c1" } }) }),
    );
    expect(prisma.categoria.update).toHaveBeenCalled();
  });

  it("devuelve 404 si la categoría no existe", async () => {
    const { prisma, categorias } = servicio();
    prisma.categoria.findUnique.mockResolvedValue(null);

    await expect(categorias.modificar("no-existe", { nombre: "Cualquiera" })).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.categoria.update).not.toHaveBeenCalled();
  });
});

describe("CategoriesService.borrar", () => {
  it("borra solo la categoría y no pide borrar productos", async () => {
    const { prisma, categorias } = servicio();
    prisma.categoria.findUnique.mockResolvedValue({
      id: "c1",
      nombre: "Ramos",
      slug: "ramos",
      orden: 0,
    });
    prisma.categoria.delete.mockResolvedValue({});

    const r = await categorias.borrar("c1");

    expect(prisma.categoria.delete).toHaveBeenCalledWith({ where: { id: "c1" } });
    // Los productos quedan sin categoría por la FK (onDelete: SetNull),
    // no por una consulta que el servicio tenga que hacer.
    expect(prisma.producto.deleteMany).not.toHaveBeenCalled();
    expect(r).toEqual({ mensaje: "Categoría borrada" });
  });

  it("devuelve 404 si la categoría no existe", async () => {
    const { prisma, categorias } = servicio();
    prisma.categoria.findUnique.mockResolvedValue(null);

    await expect(categorias.borrar("no-existe")).rejects.toThrow(NotFoundException);
    expect(prisma.categoria.delete).not.toHaveBeenCalled();
  });
});
