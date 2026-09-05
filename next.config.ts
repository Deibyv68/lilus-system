import type { NextConfig } from "next";
import path from "node:path";

/*
  ¿Este build es el de la tienda en la nube?

  Es el mismo interruptor que ya usa `proxy.ts` para servir solo la tienda
  y responder 404 al panel. Aquí decide algo distinto pero de la misma
  familia: qué módulos entran siquiera en el paquete.
*/
const soloTienda = process.env.SOLO_TIENDA === "1";

/*
  Los módulos nativos, y qué hacer con ellos según dónde vaya el build.

  En la laptop se dejan FUERA del paquete (`serverExternalPackages`): son
  binarios compilados y empaquetarlos metería los de la máquina que
  compila, que no tienen por qué ser los de la que ejecuta.

  En la nube no se pueden dejar fuera ni dentro: Cloudflare Workers no
  ejecuta binarios, y el empaquetador se cae al encontrarse un `.node`.
  Ahí se cambian por un módulo que lanza si alguien los llama. Es seguro
  porque los tres cuelgan solo del panel, y el panel no va a la nube.
*/
const NATIVOS = ["sharp", "tesseract.js", "pdf-to-png-converter", "pdfjs-dist", "@napi-rs/canvas"];
const HUECO = path.join(__dirname, "cloud", "nativo-ausente.js");

const nextConfig: NextConfig = {
  // Evita que Turbopack intente empaquetar el cliente de Prisma (binarios nativos).
  // Sin esto, los workers de compilación mueren al ejecutar server actions que
  // usan Prisma → "Jest worker encountered 2 child process exceptions".
  serverExternalPackages: [
    "@prisma/client",
    ".prisma/client",
    "bwip-js",
    /*
      Sharp tiene binarios compilados por sistema operativo. Empaquetarlo
      dejaría dentro los de esta máquina —Windows— y el despliegue corre
      en Linux: el servidor arrancaría bien y solo fallaría al preparar
      la primera imagen de un comprobante, que es el peor momento para
      enterarse.
    */
    ...(soloTienda ? [] : ["sharp", "pdf-to-png-converter", "pdfjs-dist", "@napi-rs/canvas"]),
    /*
      Tesseract lanza un worker de Node y resuelve su ruta en tiempo de
      ejecución. Empaquetado, esa ruta apunta a la raíz virtual del
      empaquetador y el worker muere con «Cannot find module
      C:/ROOT/node_modules/tesseract.js/...». Dejándolo fuera del
      paquete se resuelve desde node_modules como cualquier otro proceso
      de Node.
    */
    ...(soloTienda ? [] : ["tesseract.js"]),
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
    ...(soloTienda
      ? { resolveAlias: Object.fromEntries(NATIVOS.map((m) => [m, HUECO])) }
      : {}),
  },
};

export default nextConfig;
