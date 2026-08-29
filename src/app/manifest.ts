import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const manifiesto = {
    name: "LILUS — Gestión de ventas",
    short_name: "LILUS",
    description:
      "Sistema de gestión de ventas de jabones artesanales LILUS. Crea pedidos, imprime etiquetas y administra el catálogo.",
    start_url: "/sistema", // la PWA instalada es el panel, no la tienda
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
    /*
      Aparecer en el menú de «Compartir» de Android.

      El comprobante llega por WhatsApp. Sin esto hay que guardarlo en la
      galería, abrir el panel, buscar el pedido, tocar «adjuntar» y volver
      a encontrarlo entre las fotos — cinco pasos con el chat abierto
      detrás. Con esto son dos: compartir y elegir el pedido.

      Va como POST con `multipart/form-data` porque lo que viaja es un
      archivo, y eso no cabe en una dirección web. El nombre del campo,
      `comprobante`, es el mismo que usa el formulario de subir: así la
      ruta que lo recibe no tiene que distinguir de dónde vino.

      Solo funciona con la app instalada en el teléfono. Desde el
      navegador suelto, Android no ofrece la opción — no es un fallo, es
      cómo está definido `share_target`.

      Nota de TypeScript: el tipo de manifiesto de Next todavía no
      describe `share_target`, aunque el navegador sí lo entiende. De ahí
      el ensanchamiento de tipo de abajo, en vez de un `any` suelto.
    */
    share_target: {
      action: "/api/compartir",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        title: "titulo",
        text: "texto",
        files: [
          {
            name: "comprobante",
            accept: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
          },
        ],
      },
    },
    /*
      Aparecer en el «abrir con» de una ubicación.

      Al tocar una ubicación en WhatsApp, Android ofrece abrirla con otra
      app y le pasa una dirección `geo:`. Registrándonos para ese esquema,
      LILUS sale en esa lista junto a Google Maps — y la ubicación que la
      clienta mandó por el chat se puede pegar a su pedido sin
      transcribir nada.

      Es el mismo camino que el comprobante compartido, por otra puerta:
      WhatsApp no deja compartir una ubicación como texto, pero sí
      abrirla.

      `geo` está en la lista de esquemas que un sitio puede manejar; no es
      un invento nuestro. El soporte en Android todavía es desigual, así
      que esto puede no aparecer en todos los teléfonos — si no aparece,
      no se pierde nada: sigue estando pegar el enlace a mano.

      El `%s` lo reemplaza el navegador por la dirección completa.
    */
    protocol_handlers: [
      {
        protocol: "geo",
        url: "/sistema/ubicacion?g=%s",
      },
    ],
    shortcuts: [
      {
        name: "Nuevo pedido",
        short_name: "Nuevo",
        url: "/sistema/pedidos/nuevo",
        description: "Crear un nuevo pedido rápido",
      },
      {
        name: "Pedidos",
        short_name: "Pedidos",
        url: "/sistema/pedidos",
      },
    ],
  };

  /*
    `share_target` no está en el tipo de Next, pero sí en el estándar y en
    Chrome. Se ensancha aquí y en un solo sitio, en vez de repartir `any`
    por el objeto — el resto del manifiesto sigue comprobándose.
  */
  return manifiesto as MetadataRoute.Manifest;
}
