import { SaludController } from "./salud.controller";
import { SaludService } from "./salud.service";

/** Prisma mÃ­nimo para probar el service sin levantar la base. */
function prismaQue(responde: () => Promise<unknown>) {
  return { $queryRaw: responde } as never;
}

describe("SaludService", () => {
  it("responde ok cuando la base responde", async () => {
    const service = new SaludService(prismaQue(async () => [{ ok: 1 }]));

    const estado = await service.revisar();

    expect(estado.estado).toBe("ok");
    expect(estado.baseDatos).toBe("conectada");
  });

  it("consulta la base de datos", async () => {
    let consultada = false;
    const service = new SaludService(
      prismaQue(async () => {
        consultada = true;
        return [];
      }),
    );

    await service.revisar();

    expect(consultada).toBe(true);
  });

  it("responde degradado sin lanzar cuando la base cae", async () => {
    const service = new SaludService(
      prismaQue(async () => {
        throw new Error("ECONNREFUSED 127.0.0.1:5433");
      }),
    );

    const estado = await service.revisar();

    expect(estado.estado).toBe("degradado");
    expect(estado.baseDatos).toBe("sin respuesta");
  });

  it("nunca lanza, aunque la base falle", async () => {
    const service = new SaludService(
      prismaQue(async () => {
        throw new Error("boom");
      }),
    );

    await expect(service.revisar()).resolves.toBeDefined();
  });
});

describe("SaludController", () => {
  it("delega en el service", async () => {
    const service = { revisar: jest.fn().mockResolvedValue({ estado: "ok" }) };
    const controller = new SaludController(service as never);

    const resultado = await controller.revisar();

    expect(service.revisar).toHaveBeenCalledTimes(1);
    expect(resultado).toEqual({ estado: "ok" });
  });

  it("responde sin tocar la base en /listo", () => {
    const controller = new SaludController({} as never);

    expect(controller.listo()).toEqual({ estado: "ok" });
  });
});
