import { Body, Controller, Get, HttpCode, Post, Res } from "@nestjs/common";
import type { Response } from "express";
import { Propietario, UsaPropietario } from "../../common/decorators/usa-propietario.decorator";
import { CredencialesDto } from "./dto/credenciales.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("ingresar")
  @HttpCode(200)
  async ingresar(
    @Body() credenciales: CredencialesDto,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<{ mensaje: string }> {
    const token = await this.auth.ingresar(credenciales);

    if (!token) {
      // Mismo mensaje para correo inexistente y contraseña mala: noisy leaking
      respuesta.status(401).json({
        statusCode: 401,
        message: "Correo o contraseña incorrectos",
      });
      return { mensaje: "" };
    }

    respuesta.cookie(this.auth.nombreCookie(), token, {
      httpOnly: true,
      sameSite: "lax",
      secure: respuesta.req.secure,
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { mensaje: "Sesión iniciada" };
  }

  @Post("salir")
  @HttpCode(200)
  salir(@Res({ passthrough: true }) respuesta: Response): { mensaje: string } {
    respuesta.clearCookie(this.auth.nombreCookie(), { path: "/" });
    return { mensaje: "Sesión cerrada" };
  }

  @Get("yo")
  @UsaPropietario()
  yo(@Propietario() propietario: { email: string }) {
    return { email: propietario.email };
  }
}
