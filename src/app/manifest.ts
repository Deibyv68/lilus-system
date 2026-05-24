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
    theme_color: "#ffffff",
    lang: "es-EC",
    categories: ["business", "productivity", "shopping"],
    // Usamos el PNG del sello LILUS para todos los tamaños.
    // Next.js sirve src/app/icon.png en la ruta /icon automáticamente.
    icons: [
      {
        src: "/brand/lilus-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/lilus-logo.png",
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
