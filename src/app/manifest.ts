import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LILUS — Gestión de ventas",
    short_name: "LILUS",
    description:
      "Sistema de gestión de ventas de jabones artesanales LILUS. Crea pedidos, imprime etiquetas y administra el catálogo.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0a0a0a",
    lang: "es-EC",
    categories: ["business", "productivity", "shopping"],
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-large",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Nuevo pedido",
        short_name: "Nuevo",
        url: "/pedidos/nuevo",
        description: "Crear un nuevo pedido rápido",
      },
      {
        name: "Pedidos",
        short_name: "Pedidos",
        url: "/pedidos",
      },
    ],
  };
}
