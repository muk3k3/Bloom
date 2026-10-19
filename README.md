# 🌸 Bloom — Catálogo de floristería

Catálogo web para una floristería peruana. El propietario publica sus ramos y arreglos
florales con fotos, precio y descripción; los clientes navegan el catálogo **sin registrarse**
y cotizan por WhatsApp.

No hay carrito, ni pagos, ni cuentas de cliente. La web muestra el catálogo; la venta se
cierra en WhatsApp.

---

## Stack

| Capa                | Tecnología                                                |
| ------------------- | --------------------------------------------------------- |
| Backend             | NestJS 11 + Prisma 7                                      |
| Base de datos       | PostgreSQL (Docker en desarrollo, Supabase en producción) |
| Almacenamiento      | Supabase Storage en producción, disco local en desarrollo |
| Frontend            | Next.js 15 (App Router) + Tailwind CSS 4                  |
| Datos en el cliente | TanStack Query + React Hook Form + Zod                    |
| Monorepo            | npm workspaces (`client/`, `server/`)                     |

**Documentación** (vive en Notion, no en el repositorio):

- Especificación → [Bloom — Especificación](https://app.notion.com/p/3fe17e228ece817db8eac21b6179fa05)
- Plan → [Bloom — Plan de implementación](https://app.notion.com/p/3fe17e228ece8103b5c1e971bab4a05b)
- Tareas → [Bloom — Tareas](https://app.notion.com/p/3fe17e228ece81f2be0ce058799235d1)
- Diseño → [Bloom — Diseño](https://app.notion.com/p/3fe17e228ece81af8a05e0cb1c76bd1b)
- Reglas de trabajo → [Bloom — Reglas de trabajo](https://app.notion.com/p/3fe17e228ece817e851ecd019296a253)

---

## Empezar

```bash
git clone https://github.com/muk3k3/Bloom.git
cd Bloom
npm run setup
```

`npm run setup` hace todo: instala dependencias, levanta Postgres con Docker, genera el
cliente de Prisma, aplica las migraciones y carga datos de ejemplo.

Después:

```bash
npm run dev
```

- **Sitio público** → http://localhost:3000
- **Panel del propietario** → http://localhost:3000/admin
- **API** → http://localhost:3001/api

---

## Comandos principales

### Everyday

| Comando         | Qué hace                                                           |
| --------------- | ------------------------------------------------------------------ |
| `npm run setup` | Prepara todo tras clonar. Es el único que necesitas la primera vez |
| `npm run dev`   | Levanta el server (`:3001`) y el cliente (`:3000`) a la vez        |
| `npm run build` | Build de producción de ambos paquetes                              |

### Calidad

| Comando               | Qué hace                                                        |
| --------------------- | --------------------------------------------------------------- |
| `npm run lint`        | Revisa ESLint. Agrega `--fix` para corregir                     |
| `npm run lint:staged` | Solo los archivos modificados. Es lo que corre Husky            |
| `npm run format`      | Formatea con Prettier                                           |
| `npm run typecheck`   | Verifica los tipos de ambos paquetes                            |
| `npm run test`        | Corre las pruebas. Agrega `-- --coverage` para ver la cobertura |

### Base de datos

| Comando                                     | Qué hace                                                                |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| `npm run prisma:migrate --workspace=server` | Crea y aplica una migración. **Solo después de editar `schema.prisma`** |
| `npm run prisma:deploy --workspace=server`  | Aplica las migraciones pendientes                                       |
| `npm run prisma:seed --workspace=server`    | Carga datos de ejemplo                                                  |
| `npm run prisma:studio --workspace=server`  | Abre Prisma Studio para mirar la base                                   |

### Por paquete

```bash
npm run test --workspace=server
npm run test --workspace=client
npm run lint --workspace=server
```

### E2E

| Comando            | Qué hace                                        |
| ------------------ | ----------------------------------------------- |
| `npm run test:e2e` | Pruebas de Playwright sobre los flujos críticos |

### Git

| Comando                | Qué hace                                  |
| ---------------------- | ----------------------------------------- |
| `npm run commit`       | Abre el commit con el mensaje ya validado |
| `docker compose up -d` | Levanta solo Postgres                     |
| `docker compose down`  | Apaga Postgres                            |

---

## 🔑 Credenciales de prueba

**Solo existen en desarrollo. Nunca funcionan en producción.**

| Dónde            | Qué                           | Credencial                     |
| ---------------- | ----------------------------- | ------------------------------ |
| `/admin`         | Correo del propietario        | `dueno@bloom.local`            |
| `/admin`         | Contraseña                    | `Bloom2026!`                   |
| API              | Token de Supabase (si migras) | `.env` local, nunca versionado |
| Datos de ejemplo | WhatsApp del negocio          | `51987654321`                  |

El acceso al panel se controla con la variable `OWNER_EMAIL`. **Un correo distinto recibe 403**,
aunque tenga la contraseña correcta.

Los datos de ejemplo incluyen 3 categorías y 8 productos con fotos de muestra, para que el
catálogo no arranque vacío.

---

## Cómo se trabaja

### Antes de empezar

1. Crea tu rama desde `dev` actualizado.
2. Commits en formato `tipo: descripción`, en español y minúscula.
3. Un PR por tarea hacia `dev`.

### Ramas

| Rama               | Para qué                |
| ------------------ | ----------------------- |
| `main`             | Producción              |
| `dev`              | Integración             |
| `feature-tunombre` | El trabajo de una tarea |

```bash
# Empezar una tarea
git switch dev && git pull && git switch -c feature-tunombre

# Traer cambios de dev a tu rama
git fetch origin && git merge origin/dev

# Publicar y abrir el PR
git push -u origin feature-tunombre
gh pr create --base dev --fill
```

Después del merge, borra la rama y crea una nueva desde `dev`.

### Commits

Formato: `tipo: descripción`. En español, minúscula, sin punto final, **sin códigos de
historia** (nada de `T1`, `HU01`) y **sin alcance**. El hook `commit-msg` lo valida.

| Tipo       | Uso                                        |
| ---------- | ------------------------------------------ |
| `feat`     | Funcionalidad nueva                        |
| `fix`      | Corrección de un error                     |
| `refactor` | Cambio interno que no altera el resultado  |
| `test`     | Pruebas                                    |
| `style`    | Formato o estilos sin cambiar lógica       |
| `docs`     | Documentación                              |
| `ci`       | Workflows de GitHub Actions                |
| `chore`    | Mantenimiento: dependencias, configuración |

```
✅ feat: tabla de productos con nombre único
✅ fix: validación del teléfono de whatsapp
✅ test: cálculo del precio mostrado

❌ cambios                          (sin tipo)
❌ feat: T1 categorias              (código de historia)
❌ Feat: Categorías.                (mayúscula y punto)
❌ feat(catalog): tabla de productos (no se usa alcance)
```

Commits pequeños y frecuentes. Cada commit es evidencia del avance.

Antes de cada commit, revisa qué vas a subir:

```bash
git status
git diff --staged --stat
```

---

## 🚫 Qué no se sube nunca

| No subir                                                                                                                                                | Por qué                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `.env`, `.env.local`, claves, tokens                                                                                                                    | El repositorio es público                             |
| `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.claude/`, `.codex/`, `.cursor/`, `.opencode/`, `opencode.json`, `.mcp.json`, `.github/copilot-instructions.md` | No se permiten agentes de IA dentro del repositorio   |
| `node_modules/`, `dist/`, `.next/`, `coverage/`, `*.tsbuildinfo`                                                                                        | Se generan solos                                      |
| `pnpm-lock.yaml`, `yarn.lock`, `bun.lock`                                                                                                               | Solo se usa npm. El único lock es `package-lock.json` |
| Archivos personales: `.DS_Store`, `.vscode/`, capturas, PDFs                                                                                            | Ensucian el historial                                 |
| Código comentado, `console.log` de depuración                                                                                                           | Se borra antes del commit                             |

**Si subiste un secreto por error**, bórralo del índice **y cámbialo**. Borrarlo del
historial no basta:

```bash
git rm --cached ruta/del/archivo
git commit -m "chore: quitar archivo que no debe versionarse"
```

---

## Si algo falla

<details>
<summary><b>El commit fue rechazado por el formato</b></summary>

Commitlint dice qué está mal. Para corregir el último commit:

```bash
git commit --amend -m "feat: descripción corregida"
```

</details>

<details>
<summary><b>El pre-commit falla por lint</b></summary>

```bash
npm run lint --workspace=client
npm run lint --workspace=server
```

Corrige lo que indica, vuelve a hacer `git add` y commit.
</details>

<details>
<summary><b>El CI falla en el PR</b></summary>

Abre el PR, ve a **Checks** y mira el paso que falló (lint, test o build). Reproduce el
mismo comando en tu máquina, corrige y sube otro commit.
</details>

<details>
<summary><b>El PR tiene conflictos</b></summary>

```bash
git fetch origin
git merge origin/dev
```

Resuelve, luego `git add .`, `git commit -m "chore: resolver conflictos con dev"` y `git push`.
</details>

---

## Estructura

```
bloom/
  client/           Next.js App Router
    src/app/        páginas y layouts
    src/features/   una carpeta por módulo
    src/components/ UI compartida y de layout
    src/lib/        fetch, formato, whatsapp
  server/           NestJS
    prisma/         schema y migraciones
    src/modules/    una carpeta por módulo
    src/common/     guards, decorators, utils
```

> Los specs, el plan y las tareas **no viven en el repositorio**. La fuente de verdad está
> en Notion (enlaces arriba), para que no queden desactualizados respecto al código.

**Regla de estructura:** el código de un módulo vive en su carpeta. Un módulo no lee las
tablas de otro: si necesita datos de `categories`, inyecta `CategoriesService`.

Cada módulo del server tiene la misma forma:

```
modules/catalog/
  catalog.controller.ts   rutas HTTP, sin lógica de negocio
  catalog.service.ts      reglas del negocio y acceso a Prisma
  catalog.service.spec.ts pruebas de las reglas
  dto/                    validaciones
```

---

## Convenciones

| Qué            | Formato                      | Ejemplo                                |
| -------------- | ---------------------------- | -------------------------------------- |
| Dominio        | Español, **sin tildes ni ñ** | `producto`, `categoria`                |
| Archivos       | kebab-case                   | `crear-producto.dto.ts`                |
| Clases         | PascalCase                   | `CatalogService`, `TarjetaProducto`    |
| Variables      | camelCase                    | `calcularPrecioMostrado`               |
| Endpoints      | plural, kebab-case           | `/api/productos`                       |
| Modelos Prisma | PascalCase, tabla snake_case | `model Producto` → `@@map("producto")` |
| Dinero         | `Decimal(10,2)` en soles     | Pantalla: `S/ 50.00`                   |
| Zona horaria   | `America/Lima`               |                                        |

---

## Enlaces

- Repositorio → [github.com/muk3k3/Bloom](https://github.com/muk3k3/Bloom)
- [Bloom — Documentación](https://app.notion.com/p/3fe17e228ece818188e1d8fa9de867d8) — el índice de todo lo anterior
