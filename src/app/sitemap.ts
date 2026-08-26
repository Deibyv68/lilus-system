import type { MetadataRoute } from "next";
import { listarCatalogo } from "@/lib/tienda";

/**
 * El mapa del sitio, armado desde lo que está publicado.
 *
 * Sale de la misma consulta que pinta el catálogo, así que no puede
 * desincronizarse: si un producto se despublica, deja de estar acá en el
 * mismo momento en que deja de verse. Un sitemap escrito a mano se olvida
 * y termina mandando a Google a páginas que ya no existen.
 *
 * Solo va lo público. El panel, el carrito y las páginas de pedido no
 * tienen nada que hacer en un buscador.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  const { packs, productos } = await listarCatalogo();

  const fijas: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/tienda`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/nosotros`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contacto`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/legal/terminos`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/devoluciones`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/privacidad`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const articulos: MetadataRoute.Sitemap = [...packs, ...productos].map((a) => ({
    url: `${base}/tienda/${a.slug}`,
    changeFrequency: "monthly",
    priority: a.tipo === "pack" ? 0.8 : 0.6,
  }));

  return [...fijas, ...articulos];
}
