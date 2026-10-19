import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/coverage/**",
      "**/playwright-report/**",
      "**/test-results/**",
      "server/src/generated/**",
      "server/prisma/migrations/**",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,

  // Reglas comunes a todo el código
  {
    rules: {
      // Nada de console.log: se borra antes del commit.
      // console.warn y console.error sí se permiten.
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      eqeqeq: ["error", "smart"],
      "prefer-const": "error",
    },
  },

  // Cliente: navegador
  {
    files: ["client/**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },

  // Servidor: node
  {
    files: ["server/**/*.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },

  // Configuración y scripts: node
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: globals.node,
      sourceType: "module",
    },
  },

  // Los scripts de línea de comandos usan la consola para su salida
  {
    files: ["scripts/**/*.{js,mjs}"],
    rules: {
      "no-console": "off",
    },
  },

  // Las pruebas pueden imprimir en consola
  {
    files: ["**/*.spec.ts", "**/*.e2e-spec.ts", "**/*.test.{ts,tsx}", "tests/**/*"],
    rules: {
      "no-console": "off",
    },
  },
);
