import { Controller, Get } from "@nestjs/common";
import { EstadoSalud, SaludService } from "./salud.service";

@Controller("salud")
export class SaludController {
  constructor(private readonly saludService: SaludService) {}

  @Get()
  revisar(): Promise<EstadoSalud> {
    return this.saludService.revisar();
  }

  /** Variante ligera: no toca la base de datos. */
  @Get("listo")
  listo(): { estado: string } {
    return { estado: "ok" };
  }
}
