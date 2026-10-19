// ---------------------------------------------------------------
// Reglas de commits de Bloom
//
//   tipo: descripción
//   En español, minúscula, sin punto final,
//   sin códigos de historia y SIN alcance.
//
// Ejemplos:
//   feat: tabla de productos con nombre único   ✅
//   feat(tooling): agregar filtro por categoría ❌ (usa alcance)
//   feat: T1 categorias                        ❌ (código de historia)
// ---------------------------------------------------------------

/**
 * Rechaza códigos de historia: HU05, TT01, T1, #123.
 * Se limita a los prefijos acordados para no marcar palabras normales
 * como "S3", "PS4" o "V2".
 */
const sinCodigosHistoria = (parsed) => {
  const patron = /\b(?:HU|TT|T)[-_]?\d+\b|#\d+/g;
  const encontrados = new Set();

  for (const campo of ["header", "subject", "body"]) {
    const texto = parsed[campo];
    if (!texto) continue;

    for (const encontrado of texto.match(patron) ?? []) {
      encontrados.add(encontrado);
    }
  }

  // En commitlint v19 toda regla devuelve un par [válido, mensaje].
  if (encontrados.size === 0) return [true];

  const lista = [...encontrados].join(", ");
  return [false, `No uses códigos de historia (${lista}).`];
};

sinCodigosHistoria.ruleName = "sin-codigos-historia";
sinCodigosHistoria.meta = { level: 2 };

/**
 * Rechaza subjects que no dicen nada: "wip", "cambios", "asdf"...
 * Un commit es evidencia del avance; "feat: wip" no cuenta.
 */
const PALABRAS_VACIAS = new Set([
  "wip",
  "cambios",
  "cambio",
  "prueba",
  "pruebas",
  "test",
  "tests",
  "temp",
  "temporal",
  "fix",
  "stuff",
  "foo",
  "bar",
  "baz",
  "asdf",
  "xxx",
  "todo",
  "nada",
  "varios",
  "cosas",
  "update",
  "actualizar",
  "unfinished",
  "done",
]);

const subjectConContenido = (parsed) => {
  const asunto = (parsed.subject ?? "").trim().toLowerCase();

  if (asunto === "") return [true];

  // "wip" solo, o "wip something", cuentan como vacíos
  const palabras = asunto.split(/[\s:.,!?-]+/).filter(Boolean);
  if (palabras.every((p) => PALABRAS_VACIAS.has(p))) {
    return [false, `"${parsed.subject}" no dice qué cambió. Escribe qué hiciste.`];
  }

  return [true];
};

subjectConContenido.ruleName = "subject-con-contenido";
subjectConContenido.meta = { level: 2 };

export default {
  extends: ["@commitlint/config-conventional"],

  plugins: [
    {
      rules: {
        "sin-codigos-historia": sinCodigosHistoria,
        "subject-con-contenido": subjectConContenido,
      },
    },
  ],

  rules: {
    // feat, fix, refactor, test, style, docs, ci, chore
    "type-enum": [2, "always", ["feat", "fix", "refactor", "test", "style", "docs", "ci", "chore"]],

    // Sin alcance: "feat: agregar filtro", nunca "feat(catalog): agregar filtro"
    "scope-empty": [2, "always"],

    // "agregar filtro" y no "Agregar Filtro"
    // Ojo: los casos validos son upper-case, pascal-case, start-case, camel-case,
    // kebab-case, snake-case y lower-case. "title-case" no existe y rompe el hook.
    "subject-case": [2, "never", ["upper-case", "pascal-case", "start-case"]],

    // Sin punto final
    "subject-full-stop": [2, "never", "."],

    // Sin códigos de historia: HU05, TT01, T1, #123
    "sin-codigos-historia": [2, "always"],

    // El subject debe decir qué cambió, no ser "wip" o "cambios"
    "subject-con-contenido": [2, "always"],

    // Titulos legibles en el historial
    "header-max-length": [2, "always", 100],

    // El cuerpo puede llevar tildes y enye; el codigo no
    "body-max-line-length": [0],
  },
};
