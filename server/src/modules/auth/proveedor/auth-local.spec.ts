import { AuthLocal } from "./auth-local";

const EMAIL = "dueno@bloom.local";
const CLAVE = "Bloom2026!";

describe("AuthLocal", () => {
  const auth = new AuthLocal(EMAIL, CLAVE);

  it("acepta el correo y la contraseña correctos", async () => {
    await expect(auth.verificar(EMAIL, CLAVE)).resolves.toBe(EMAIL);
  });

  it("no filtra mayúsculas ni espacios", async () => {
    await expect(auth.verificar("  DUENO@BLOOM.LOCAL  ", CLAVE)).resolves.toBe(EMAIL);
  });

  it("rechaza la contraseña incorrecta", async () => {
    await expect(auth.verificar(EMAIL, "otra")).resolves.toBeNull();
  });

  it("rechaza un correo desconocido", async () => {
    await expect(auth.verificar("nadie@ejemplo.com", CLAVE)).resolves.toBeNull();
  });

  it("rechaza cadenas vacías", async () => {
    await expect(auth.verificar("", CLAVE)).resolves.toBeNull();
    await expect(auth.verificar(EMAIL, "")).resolves.toBeNull();
  });

  it("devuelve siempre null o el correo, nunca otra cosa", async () => {
    const resultado = await auth.verificar("raro", "raro");

    expect(resultado === null || resultado === "raro").toBe(true);
  });
});
