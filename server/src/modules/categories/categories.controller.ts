import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { UsaPropietario } from "../../common/decorators/usa-propietario.decorator";
import { CategoriesService } from "./categories.service";
import { CategoriaDto } from "./dto/categoria.dto";

/**
 * CRUD de categorías. SPEC §categories: todo el módulo exige sesión.
 *
 * El decorador va a nivel de controller y no en cada método a propósito:
 * así un endpoint nuevo no puede nacer sin cubrirse. Es el mismo criterio con
 * el que el panel entero se protege desde el layout.
 */
@UsaPropietario()
@Controller("categorias")
export class CategoriesController {
  constructor(private readonly categorias: CategoriesService) {}

  @Get()
  listar() {
    return this.categorias.listar();
  }

  @Post()
  crear(@Body() datos: CategoriaDto) {
    return this.categorias.crear(datos);
  }

  @Patch(":id")
  modificar(@Param("id") id: string, @Body() datos: CategoriaDto) {
    return this.categorias.modificar(id, datos);
  }

  @Delete(":id")
  borrar(@Param("id") id: string) {
    return this.categorias.borrar(id);
  }
}
