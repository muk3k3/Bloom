import { PrismaPg } from "@prisma/adapter-pg";
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "../generated/prisma/client";

const DESARROLLO = "postgresql://bloom:bloom@localhost:5433/bloom?schema=public";

/**
 * Cliente de Prisma, disponible en toda la aplicaciÃƒÆ’Ã‚Â³n.
 *
 * Es global: cualquier mÃƒÆ’Ã‚Â³dulo lo inyecta sin importar nada mÃƒÆ’Ã‚Â¡s.
 *
 * Prisma 7 exige un driver adapter: el cliente ya no lleva la URL dentro.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService) {
    const conexion = config.get<string>("DATABASE_URL") ?? DESARROLLO;
    super({ adapter: new PrismaPg({ connectionString: conexion }) });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
