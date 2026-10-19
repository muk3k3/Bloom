import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "Bloom — Floristería",
    template: "%s · Bloom",
  },
  description: "Ramos y arreglos florales hechos a mano. Escríbenos y lo armamos para ti.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-fondo text-texto antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
