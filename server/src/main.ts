import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { exigirEntorno } from "./common/auth/entorno";
import { crearValidacion } from "./common/validacion/pipe";

async function arrancar() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Falla rápido y con un mensaje claro, ANTES de abrir el puerto.
  // Se valida aquí y no en el constructor de AppModule porque ConfigModule
  // todavía no ha leído el .env en ese punto.
  exigirEntorno({
    OWNER_EMAIL: config.get<string>("OWNER_EMAIL"),
    COOKIE_SECRET: config.get<string>("COOKIE_SECRET"),
  });

  // Todo el API vive bajo /api, para que el cliente lo reescriba en un solo origen
  app.setGlobalPrefix("api");

  // Valida los DTOs antes de que lleguen al service. El pipe se construye en
  // common/validacion/pipe.ts para que las pruebas usen exactamente este.
  app.useGlobalPipes(crearValidacion());

  app.use(cookieParser());

  const origenes = (config.get<string>("APP_URL") ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim());

  app.enableCors({
    origin: origenes,
    credentials: true,
  });

  const puerto = config.get<number>("PORT") ?? 3001;

  await app.listen(puerto);

  console.warn(`API escuchando en http://localhost:${puerto}/api`);
  console.warn(`Salud: http://localhost:${puerto}/api/salud`);
}

arrancar().catch((error) => {
  console.error("No se pudo arrancar el servidor:", error);
  process.exit(1);
});
