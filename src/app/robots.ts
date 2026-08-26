import type { MetadataRoute } from "next";

/**
 * Qué puede recorrer un buscador.
 *
 * La tienda sí; todo lo demás no. El panel ya manda `noindex` por
 * cabecera y por etiqueta, pero eso solo actúa cuando el buscador ya
 * entró: esto le evita el viaje.
 *
 * `/pedido/` es el caso que más importa. Cada dirección de esas es la
 * llave del pedido de una persona, y aunque nadie las enlaza, basta que
 * una clienta pegue la suya en un foro pidiendo ayuda para que quede
 * indexada y buscable. Aquí se dice explícitamente que no.
 */
export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_URL?.replace(/\/+$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/sistema", "/login", "/api", "/carrito", "/checkout", "/pedido"],
    },
    // Sin APP_URL configurada no se anuncia el sitemap: una dirección
    // apuntando a localhost en el robots.txt de producción es peor que no
    // ponerla.
    sitemap: base ? `${base}/sitemap.xml` : undefined,
  };
}
