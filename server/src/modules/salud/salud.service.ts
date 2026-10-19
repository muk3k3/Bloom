import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";

export interface EstadoSalud {
  estado: "ok" | "degradado";
  baseDatos: string;
  version: string;
}

@Injectable()
export class SaludService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Comprueba que la API responde y que la base de datos contesta.
   * Si la base cae, la API sigue levantada pero lo dice: sirve para
   * distinguir "el servidor no arrancó" de "el servidor no llega a la base".
   */
  async revisar(): Promise<EstadoSalud> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        estado: "ok",
        baseDatos: "conectada",
        version: process.env.npm_package_version ?? "0.1.0",
      };
    } catch {
      return {
        estado: "degradado",
        baseDatos: "sin respuesta",
        version: process.env.npm_package_version ?? "0.1.0",
      };
    }
  }
}
