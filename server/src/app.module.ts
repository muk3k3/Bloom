import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SaludModule } from "./modules/salud/salud.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    // Lee server/.env. isGlobal para que cualquier mÃƒÆ’Ã‚Â³dulo tenga ConfigService.
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SaludModule,
  ],
})
export class AppModule {}
