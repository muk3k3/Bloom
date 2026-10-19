import { crearToken, DURACION_MS, verificarToken } from "./cookie";

const SECRETO = "un-secreto-de-prueba-que-no-es-real";

describe("crearToken", () => {
  it("firma y devuelve algo legible", () => {
    const token = crearToken({ email: "dueno@bloom.local", emitidaEn: Date.now() }, SECRETO);

    expect(token.split(".")).toHaveLength(2);
  });
});

describe("verificarToken", () => {
  it("devuelve la sesión de un token válido", () => {
    const emitidaEn = Date.now();
    const token = crearToken({ email: "dueno@bloom.local", emitidaEn }, SECRETO);

    const sesion = verificarToken(token, SECRETO);

    expect(sesion?.email).toBe("dueno@bloom.local");
    expect(sesion?.emitidaEn).toBe(emitidaEn);
  });

  it("rechaza un token firmado con otro secreto", () => {
    const token = crearToken({ email: "dueno@bloom.local", emitidaEn: Date.now() }, SECRETO);

    expect(verificarToken(token, "otro-secreto-distinto")).toBeNull();
  });

  it("rechaza un token al que le cambian el correo sin volver a firmarlo", () => {
    const emitido = crearToken({ email: "dueno@bloom.local", emitidaEn: Date.now() }, SECRETO);

    // El atacante reescribe el cuerpo y deja la firma vieja
    const [cuerpo] = emitido.split(".");
    const alterado = [
      Buffer.from(
        JSON.stringify({ email: "ladrón@ejemplo.com", emitidaEn: Date.now() }),
        "utf8",
      ).toString("base64url"),
      cuerpo,
    ].join(".");

    expect(verificarToken(alterado, SECRETO)).toBeNull();
  });

  it("rechaza un token vencido", () => {
    const antigua = Date.now() - DURACION_MS - 1000;
    const token = crearToken({ email: "dueno@bloom.local", emitidaEn: antigua }, SECRETO);

    expect(verificarToken(token, SECRETO)).toBeNull();
  });

  it("rechaza basura", () => {
    expect(verificarToken("", SECRETO)).toBeNull();
    expect(verificarToken("sin.puntos", SECRETO)).toBeNull();
    expect(verificarToken("a.b.c", SECRETO)).toBeNull();
    expect(verificarToken("no-es-base64.firma", SECRETO)).toBeNull();
  });

  it("no acepta un correo vacío", () => {
    const token = crearToken({ email: "", emitidaEn: Date.now() }, SECRETO);

    expect(verificarToken(token, SECRETO)).toBeNull();
  });
});
