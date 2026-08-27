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
    /*
      Tesseract lanza un worker de Node y resuelve su ruta en tiempo de
      ejecución. Empaquetado, esa ruta apunta a la raíz virtual del
      empaquetador y el worker muere con «Cannot find module
      C:\ROOT
ode_modules	esseract.js\...». Dejándolo fuera del
      paquete se resuelve desde node_modules como cualquier otro proceso
      de Node.
    */
    "tesseract.js",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  /*
   * Poder abrir el sitio de desarrollo desde el teléfono, por Tailscale.
   *
   * Next 16 bloquea por defecto las peticiones a los recursos de
   * desarrollo que no vengan del mismo origen con el que arrancó el
   * servidor (localhost). Sin esto la página carga pero el recargado en
   * caliente no conecta, y el síntoma —«edito y no se actualiza»— no
   * apunta a su causa por ningún lado.
   *
   * Solo afecta a `next dev`. En producción no se lee.
   *
   * Va la IP y también el nombre: la IP no cambia, pero escribir
   * `emed.tailb43ebc.ts.net:3000` en el teléfono es bastante más fácil
   * que doce dígitos.
   */
  allowedDevOrigins: [
    "100.92.238.29",
    "emed.tailb43ebc.ts.net",
    "*.tailb43ebc.ts.net",
  ],
  // Silencia el warning de "multiple lockfiles" anclando el root a este proyecto.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
