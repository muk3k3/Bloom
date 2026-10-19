import { AuthSupabase } from "./auth-supabase";

const URL = "https://proyecto.supabase.co";
const CLAVE = "clave-de-servicio";

describe("AuthSupabase", () => {
  const auth = new AuthSupabase(URL, CLAVE);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const responder = (cuerpo: unknown, ok = true) => ({ ok, json: async () => cuerpo }) as Response;

  it("devuelve el correo cuando Supabase acepta", async () => {
    global.fetch = jest.fn().mockResolvedValue(responder({ email: "dueno@bloom.local" }));

    await expect(auth.verificar("dueno@bloom.local", "clave")).resolves.toBe("dueno@bloom.local");
  });

  it("acepta la forma anidada user.email", async () => {
    global.fetch = jest.fn().mockResolvedValue(responder({ user: { email: "dueno@bloom.local" } }));

    await expect(auth.verificar("dueno@bloom.local", "clave")).resolves.toBe("dueno@bloom.local");
  });

  it("devuelve null si Supabase rechaza las credenciales", async () => {
    global.fetch = jest.fn().mockResolvedValue(responder({}, false));

    await expect(auth.verificar("dueno@bloom.local", "mala")).resolves.toBeNull();
  });

  it("devuelve null si la respuesta no trae correo", async () => {
    global.fetch = jest.fn().mockResolvedValue(responder({}));

    await expect(auth.verificar("dueno@bloom.local", "clave")).resolves.toBeNull();
  });

  it("llama al endpoint de password con apikey", async () => {
    const spy = jest.fn().mockResolvedValue(responder({ email: "dueno@bloom.local" }));
    global.fetch = spy as unknown as typeof fetch;

    await auth.verificar("dueno@bloom.local", "clave");

    const [url, opciones] = spy.mock.calls[0];
    expect(url).toBe(`${URL}/auth/v1/token?grant_type=password`);
    expect((opciones as RequestInit).method).toBe("POST");
  });
});
