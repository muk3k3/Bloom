import { ConfigService } from "@nestjs/config";
import { ForbiddenException } from "@nestjs/common";
import { crearToken } from "../../common/auth/cookie";
import { AuthService } from "./auth.service";
import { AuthProveedor } from "./proveedor/auth-proveedor";

const CORRETO = "dueno@bloom.local";

function configCon(extra: Record<string, string | undefined> = {}) {
  return {
    get: (clave: string) =>
      ({
        OWNER_EMAIL: CORRETO,
        COOKIE_SECRET: "secreto-de-prueba",
        ...extra,
      })[clave],
    getOrThrow: (clave: string) => {
      const valor = configCon(extra).get(clave);
      if (!valor) throw new Error(`falta ${clave}`);
      return valor;
    },
  } as unknown as ConfigService;
}

/** Proveedor falso: decide qué credenciales acepta. */
function proveedorQue(acepta: (email: string, password: string) => boolean): AuthProveedor {
  return {
    verificar: async (email, password) => (acepta(email, password) ? email : null),
  };
}

function servicio(acepta: (email: string, password: string) => boolean = () => true) {
  return new AuthService(proveedorQue(acepta), configCon());
}

describe("AuthService.ingresar", () => {
  it("devuelve un token con credenciales correctas", async () => {
    const token = await servicio().ingresar({ email: CORRETO, password: "cualquiera" });

    expect(token).toEqual(expect.any(String));
  });

  it("devuelve null con contraseña incorrecta", async () => {
    const token = await servicio((_e, p) => p === "bien").ingresar({
      email: CORRETO,
      password: "mal",
    });

    expect(token).toBeNull();
  });

  it("devuelve null con un correo que el proveedor no reconoce", async () => {
    // Un proveedor real solo conoce al propietario: si el correo no existe,
    // nunca llega a la comparación con OWNER_EMAIL.
    const token = await servicio((e) => e === CORRETO).ingresar({
      email: "nadie@ejemplo.com",
      password: "bien",
    });

    expect(token).toBeNull();
  });

  it("lanza 403 si las credenciales son de otra persona", async () => {
    // El proveedor acepta cualquier correo, pero no es el del propietario
    const token = servicio(() => true).ingresar;

    await expect(
      new AuthService(
        proveedorQue(() => true),
        configCon(),
      ).ingresar({
        email: "alguien@ejemplo.com",
        password: "bien",
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(token).toBeDefined();
  });

  it("no filtra el caso del correo", async () => {
    // El proveedor real (AuthLocal y Supabase) normaliza a minúsculas.
    const token = await servicio((e) => e.toLowerCase() === CORRETO).ingresar({
      email: CORRETO.toUpperCase(),
      password: "bien",
    });

    expect(token).toEqual(expect.any(String));
  });
});

describe("AuthService.leerCookie", () => {
  it("devuelve la sesión de un token válido", async () => {
    const s = servicio();
    const token = await s.ingresar({ email: CORRETO, password: "bien" });

    const sesion = s.leerCookie(token!);

    expect(sesion?.email).toBe(CORRETO);
    expect(sesion?.esPropietario).toBe(true);
  });

  it("devuelve null sin cookie", () => {
    expect(servicio().leerCookie(undefined)).toBeNull();
  });

  it("devuelve null con cookie de otro secreto", async () => {
    const token = await servicio().ingresar({ email: CORRETO, password: "bien" });

    const otro = new AuthService(
      proveedorQue(() => true),
      configCon({ COOKIE_SECRET: "otro-secreto" }),
    );

    expect(otro.leerCookie(token!)).toBeNull();
  });

  it("devuelve null si la sesión es de alguien que no es el propietario", async () => {
    const forjado = crearToken(
      { email: "ladrón@ejemplo.com", emitidaEn: Date.now() },
      "secreto-de-prueba",
    );

    expect(servicio().leerCookie(forjado)).toBeNull();
  });
});

describe("AuthService.salir", () => {
  it("devuelve opciones de cookie httpOnly", () => {
    expect(servicio().salir()).toMatchObject({ httpOnly: true, path: "/" });
  });
});
