import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthLocal } from "./proveedor/auth-local";
import { AuthSupabase } from "./proveedor/auth-supabase";
import { AUTH_PROVEEDOR, nombreProveedor } from "./proveedor/auth-proveedor";

/**
 * Global porque el guard de sesión lo necesitan todos los módulos del panel
 * (catalog, media, categories, business-info), no solo auth.
 */
@Global()
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: AUTH_PROVEEDOR,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        if (nombreProveedor(config.get<string>("AUTH")) === "supabase") {
          return new AuthSupabase(
            config.getOrThrow<string>("SUPABASE_URL"),
            config.getOrThrow<string>("SUPABASE_SERVICE_ROLE_KEY"),
          );
        }

        // Desarrollo. OWNER_PASSWORD solo existe con AUTH=local.
        return new AuthLocal(
          config.get<string>("OWNER_EMAIL") ?? "",
          config.get<string>("OWNER_PASSWORD") ?? "",
        );
      },
    },
  ],
  exports: [AuthService, AUTH_PROVEEDOR],
})
export class AuthModule {}
