import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function arrancar() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Todo el API vive bajo /api, para que el cliente lo reescriba en un solo origen
  app.setGlobalPrefix("api");

  // Valida los DTOs antes de que lleguen al service
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

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
