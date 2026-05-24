import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita que Turbopack intente empaquetar el cliente de Prisma (binarios nativos).
  // Sin esto, los workers de compilación mueren al ejecutar server actions que
  // usan Prisma → "Jest worker encountered 2 child process exceptions".
  serverExternalPackages: [
    "@prisma/client",
    ".prisma/client",
    "bwip-js",
    "pdf-to-png-converter",
    "pdfjs-dist",
    "@napi-rs/canvas",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Silencia el warning de "multiple lockfiles" anclando el root a este proyecto.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
