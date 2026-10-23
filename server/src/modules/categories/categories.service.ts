import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { normalizarSlug } from "../../common/texto/slug";
import { PrismaService } from "../../prisma/prisma.service";
import { CategoriaDto } from "./dto/categoria.dto";

export const NOMBRE_TOMADO = "Ya existe una categoría con ese nombre";

/** Lo que sale por la API. Los conteos nunca viajan como _count de Prisma. */
export interface CategoriaVista {
  id: string;
  nombre: string;
  slug: string;
  orden: number;
  cantidadProductos: number;
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista ordenada por `orden` y, a igualdad, por nombre: con todos los
   * `orden` en 0 el orden es igualmente estable entre visitas.
   */
  async listar(): Promise<CategoriaVista[]> {
    const categorias = await this.prisma.categoria.findMany({
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
      include: { _count: { select: { productos: true } } },
    });

    return categorias.map((categoria) => aVista(categoria, categoria._count.productos));
  }

  async crear(datos: CategoriaDto): Promise<CategoriaVista> {
    await this.revisarNombre(datos.nombre);
    const slug = await this.slugLibre(datos.nombre);

    try {
      const creada = await this.prisma.categoria.create({
        data: { nombre: datos.nombre, slug },
      });

      return aVista(creada, 0);
    } catch (error) {
      // Dos peticiones con el mismo nombre pueden pasar la revisión a la vez.
      // La base es la última palabra y esto evita un 500.
      if (esColisionDeUnicidad(error)) throw this.nombreTomado();
      throw error;
    }
  }

  async modificar(id: string, datos: CategoriaDto): Promise<CategoriaVista> {
    const actual = await this.prisma.categoria.findUnique({ where: { id } });
    if (!actual) throw new NotFoundException("No existe esa categoría");

    // `ignorando` evita que una categoría choque consigo misma al no cambiar
    // de nombre, cosa que pasaría en cada guardado del panel.
    await this.revisarNombre(datos.nombre, id);
    const slug = await this.slugLibre(datos.nombre, id);

    try {
      const guardada = await this.prisma.categoria.update({
        where: { id },
        data: { nombre: datos.nombre, slug },
      });
      const cantidadProductos = await this.prisma.producto.count({
        where: { categoriaId: id },
      });

      return aVista(guardada, cantidadProductos);
    } catch (error) {
      if (esColisionDeUnicidad(error)) throw this.nombreTomado();
      throw error;
    }
  }

  /**
   * Borra solo la categoría.
   *
   * Los productos no se tocan: la relación es `onDelete: SetNull`, así que la
   * base deja `categoriaId` en null y el producto sigue activo y visible en el
   * catálogo. Aquí no hay ningún `delete` sobre producto.
   */
  async borrar(id: string): Promise<{ mensaje: string }> {
    const actual = await this.prisma.categoria.findUnique({ where: { id } });
    if (!actual) throw new NotFoundException("No existe esa categoría");

    await this.prisma.categoria.delete({ where: { id } });

    return { mensaje: "Categoría borrada" };
  }

  /** Único sin distinguir mayúsculas: "Ramos" y "RAMOS" son la misma. */
  private async revisarNombre(nombre: string, ignorando?: string): Promise<void> {
    const existente = await this.prisma.categoria.findFirst({
      where: {
        nombre: { equals: nombre, mode: "insensitive" },
        ...(ignorando ? { id: { not: ignorando } } : {}),
      },
    });

    if (existente) throw this.nombreTomado();
  }

  /**
   * Slug normalizado y libre. Si ya lo usa otra categoría se agrega un
   * sufijo: "Boda & Amor" y "Boda y Amor" no pueden convivir en la URL.
   */
  private async slugLibre(nombre: string, ignorando?: string): Promise<string> {
    const base = normalizarSlug(nombre) || "categoria";

    let candidato = base;
    let sufijo = 2;

    while (await this.slugOcupado(candidato, ignorando)) {
      candidato = `${base}-${sufijo}`;
      sufijo += 1;
    }

    return candidato;
  }

  private async slugOcupado(slug: string, ignorando?: string): Promise<boolean> {
    const otro = await this.prisma.categoria.findFirst({
      where: { slug, ...(ignorando ? { id: { not: ignorando } } : {}) },
    });

    return otro !== null;
  }

  /** 409 con la forma uniforme del spec §6: mensaje y detalle por campo. */
  private nombreTomado(): ConflictException {
    return new ConflictException({
      statusCode: 409,
      message: NOMBRE_TOMADO,
      errores: { nombre: NOMBRE_TOMADO },
    });
  }
}

function aVista(
  categoria: { id: string; nombre: string; slug: string; orden: number },
  cantidadProductos: number,
): CategoriaVista {
  return {
    id: categoria.id,
    nombre: categoria.nombre,
    slug: categoria.slug,
    orden: categoria.orden,
    cantidadProductos,
  };
}

/** Prisma señala las restricciones únicas con el código P2002. */
function esColisionDeUnicidad(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  return "code" in error && (error as { code?: unknown }).code === "P2002";
}
