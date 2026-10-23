import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AppModule } from "../../app.module";
import { crearToken, NOMBRE_COOKIE } from "../../common/auth/cookie";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * Pruebas contra el server y la base de verdad, no contra un mock.
 *
 * Cubren los dos criterios que un mock no puede probar: que TODOS los
 * endpoints exigen sesión y que al borrar una categoría la base deja sus
 * productos en null sin tocar su `activo`.
 *
 * Requiere Postgres en el 5433 (docker compose up -d). En la CI lo levanta
 * el servicio `postgres` y las migraciones las aplica el paso
 * "Preparar la base de datos"; sin server/.env definen las dos variables que
 * la sesión necesita.
 */
process.env.OWNER_EMAIL ??= "dueno@bloom.local";
process.env.COOKIE_SECRET ??= "secreto-de-integracion";
process.env.AUTH ??= "local";

/** Las categorías de estas pruebas empiezan con esto: así se limpian solas. */
const MARCA = "Prueba bloom";
/** Lo mismo, ya en forma de slug: MARCA tiene un espacio que no va en URLs. */
const PREFIJO = "prueba-bloom";
/** Sufijo por corrida: evita que un resto de una corrida anterior choque. */
const corrida = Date.now().toString(36);

describe("categories — integración", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cookie: string;

  const creados = { categorias: [] as string[], productos: [] as string[] };

  const api = () => request(app.getHttpServer());
  const conSesion = (peticion: request.Test) => peticion.set("Cookie", cookie);

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = modulo.createNestApplication();

    // Mismo cableado que main.ts: si esto difiere, la prueba miente.
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.use(cookieParser());

    await app.init();

    prisma = app.get(PrismaService);

    // La cookie se forja con el mismo secreto y el mismo correo que usa la
    // app: no depende de que exista un server/.env en la máquina de la CI.
    const config = app.get(ConfigService);
    const token = crearToken(
      { email: config.getOrThrow<string>("OWNER_EMAIL"), emitidaEn: Date.now() },
      config.get<string>("COOKIE_SECRET") ?? "",
    );
    cookie = `${NOMBRE_COOKIE}=${token}`;

    // Restos de una corrida anterior que se cortó a la mitad. Los productos
    // también: una categoría borrada a medias deja los suyos sueltos.
    const categoriasViejas = await prisma.categoria.findMany({
      where: { nombre: { startsWith: MARCA } },
      select: { id: true },
    });
    if (categoriasViejas.length > 0) {
      await prisma.categoria.deleteMany({
        where: { id: { in: categoriasViejas.map((c) => c.id) } },
      });
    }

    await prisma.producto.deleteMany({ where: { nombre: { startsWith: MARCA } } });
  });

  afterAll(async () => {
    if (creados.productos.length > 0) {
      await prisma.producto.deleteMany({ where: { id: { in: creados.productos } } });
    }
    if (creados.categorias.length > 0) {
      await prisma.categoria.deleteMany({ where: { id: { in: creados.categorias } } });
    }
    await app.close();
  });

  it("los cuatro endpoints exigen sesión", async () => {
    await api().get("/api/categorias").expect(401);
    await api()
      .post("/api/categorias")
      .send({ nombre: `${MARCA} sin sesión` })
      .expect(401);
    await api()
      .patch("/api/categorias/cualquiera")
      .send({ nombre: `${MARCA} sin sesión` })
      .expect(401);
    await api().delete("/api/categorias/cualquiera").expect(401);
  });

  it("el listado trae la cantidad de productos de cada categoría", async () => {
    const categoria = await prisma.categoria.create({
      data: { nombre: `${MARCA} listado ${corrida}`, slug: `${PREFIJO}-listado-${corrida}` },
    });
    creados.categorias.push(categoria.id);

    const producto = await prisma.producto.create({
      data: {
        nombre: `${MARCA} ramo ${corrida}`,
        slug: `${PREFIJO}-ramo-${corrida}`,
        descripcion: "Ramo creado por la prueba de integración",
        precio: "50.00",
        categoriaId: categoria.id,
      },
    });
    creados.productos.push(producto.id);

    const respuesta = await conSesion(api().get("/api/categorias")).expect(200);
    const vista = respuesta.body.find((c: { id: string }) => c.id === categoria.id);

    expect(vista).toMatchObject({ nombre: categoria.nombre, cantidadProductos: 1 });
    expect(vista).not.toHaveProperty("_count");
  });

  it("crea una categoría con el slug normalizado de su nombre", async () => {
    const nombre = `Boda & Amor ${corrida}`;

    const respuesta = await conSesion(api().post("/api/categorias")).send({ nombre }).expect(201);
    creados.categorias.push(respuesta.body.id);

    expect(respuesta.body).toMatchObject({
      nombre,
      slug: `boda-y-amor-${corrida}`,
      cantidadProductos: 0,
    });
  });

  it("responde 409 si el nombre ya existe, aunque cambie la caja", async () => {
    const nombre = `${MARCA} duplicada ${corrida}`;

    const creada = await conSesion(api().post("/api/categorias")).send({ nombre }).expect(201);
    // Sin esto la categoría quedaría huérfana en la base al terminar.
    creados.categorias.push(creada.body.id);

    const respuesta = await conSesion(api().post("/api/categorias"))
      .send({ nombre: nombre.toUpperCase() })
      .expect(409);

    expect(respuesta.body).toMatchObject({
      statusCode: 409,
      errores: { nombre: "Ya existe una categoría con ese nombre" },
    });
  });

  it("renombra y regenera el slug", async () => {
    const creada = await conSesion(api().post("/api/categorias"))
      .send({ nombre: `${MARCA} ramos ${corrida}` })
      .expect(201);
    creados.categorias.push(creada.body.id);

    const nombre = `Arreglos de Evento ${corrida}`;
    const respuesta = await conSesion(api().patch(`/api/categorias/${creada.body.id}`))
      .send({ nombre })
      .expect(200);

    expect(respuesta.body).toMatchObject({
      nombre,
      slug: `arreglos-de-evento-${corrida}`,
    });
  });

  it("borra la categoría y deja sus productos activos y sin categoría", async () => {
    const categoria = await conSesion(api().post("/api/categorias"))
      .send({ nombre: `${MARCA} para borrar ${corrida}` })
      .expect(201);
    creados.categorias.push(categoria.body.id);

    const producto = await prisma.producto.create({
      data: {
        nombre: `${MARCA} ramo huérfano ${corrida}`,
        slug: `${PREFIJO}-huerfano-${corrida}`,
        descripcion: "Debe sobrevivir al borrado de su categoría",
        precio: "80.00",
        activo: true,
        categoriaId: categoria.body.id,
      },
    });
    creados.productos.push(producto.id);

    await conSesion(api().delete(`/api/categorias/${categoria.body.id}`)).expect(200);

    const despues = await prisma.producto.findUnique({ where: { id: producto.id } });
    expect(despues).toMatchObject({ activo: true, categoriaId: null });
    await expect(
      prisma.categoria.findUnique({ where: { id: categoria.body.id } }),
    ).resolves.toBeNull();
  });

  it("devuelve 404 al tocar una categoría que no existe", async () => {
    await conSesion(api().patch("/api/categorias/no-existe"))
      .send({ nombre: `${MARCA} cualquiera ${corrida}` })
      .expect(404);
    await conSesion(api().delete("/api/categorias/no-existe")).expect(404);
  });

  it("rechaza un nombre vacío o de más de 60 caracteres", async () => {
    await conSesion(api().post("/api/categorias")).send({ nombre: "   " }).expect(400);
    await conSesion(api().post("/api/categorias"))
      .send({ nombre: "x".repeat(61) })
      .expect(400);
  });
});
