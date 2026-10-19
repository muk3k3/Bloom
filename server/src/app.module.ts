import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./modules/auth/auth.module";
import { SaludModule } from "./modules/salud/salud.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    // Lee server/.env. isGlobal para que cualquier módulo tenga ConfigService.
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    SaludModule,
    PrismaModule,
  ],
})
export class AppModule {}
