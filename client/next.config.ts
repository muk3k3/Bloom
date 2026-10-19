import type { NextConfig } from "next";

const API = process.env.API_URL ?? "http://localhost:3001";

const config: NextConfig = {
  reactStrictMode: true,

  // Las fotos optimizadas por el módulo media se sirven desde Supabase.
  // En desarrollo, AlmacenLocal las deja en /uploads.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "http", hostname: "localhost" },
    ],
  },

  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API}/api/:path*` }];
  },
};

export default config;
