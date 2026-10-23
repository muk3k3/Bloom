import { Module } from "@nestjs/common";
import { CategoriesController } from "./categories.controller";
import { CategoriesService } from "./categories.service";

/**
 * No importa AuthModule ni PrismaModule: el primero es global y exporta el
 * guard que usa @UsaPropietario(), el segundo también es global y exporta
 * PrismaService.
 */
@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
