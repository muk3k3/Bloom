/**
 * Normaliza un texto a slug kebab-case.
 *
 * Reglas del spec: minúsculas, sin tildes ni ñ, guiones en vez de espacios.
 * El "&" se lee como "y", que es como lo escribiría el dueño en el formulario.
 *
 *   Boda & Amor          → boda-y-amor
 *   Ramo de Añadir Ñoño  → ramo-de-anadir-nono
 *   Ramos de Rosa!       → ramos-de-rosa
 *
 * No decide nada sobre unicidad: eso le toca a cada módulo. Acá solo
 * normalizamos; quién agrega sufijo y quién devuelve 409 lo decide el servicio
 * que usa esta función.
 */
export function normalizarSlug(texto: string): string {
  return (
    texto
      // NFD separa la letra de su acento. La ñ queda como n + marca,
      // así que quitar las marcas no separables también resuelve la ñ.
      .normalize("NFD")
      // \p{Mn} = marcas no separables (el rango U+0300–U+036F y demás)
      .replace(/\p{Mn}/gu, "")
      .toLowerCase()
      .replace(/&/g, " y ")
      // Lo que no sea letra o número se vuelve separador
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}
