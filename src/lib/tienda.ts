/**
 * Lo que la tienda le puede preguntar a la base.
 *
 * Todo lo que sale de aquí es público: lo va a ver cualquiera que entre a
 * la web. Por eso las consultas eligen columna por columna en vez de traer
 * la fila entera. El costo de producción, el stock y el margen viven en la
 * misma tabla que el nombre y el precio, y basta un `include` distraído
 * para que terminen en el HTML que se manda al navegador.
 *
 * Productos y packs son dos tablas distintas pero en la tienda son la
 * misma cosa: algo con foto, nombre y precio que se puede meter al
 * carrito. Se normalizan aquí, y de aquí para arriba nadie tiene que
 * volver a preguntarse cuál de los dos es.
 */

import { prisma } from "./prisma";

export type TipoArticulo = "producto" | "pack";

export type ArticuloResumen = {
  tipo: TipoArticulo;
  id: string;
  slug: string;
  nombre: string;
  tagline: string | null;
  precio: number;
  imagen: string | null;
  imagenAlt: string | null;
};

export type ArticuloDetalle = ArticuloResumen & {
  descripcion: string | null;
  ingredientes: string | null;
  imagenes: { url: string; alt: string | null }[];
  /** Solo en packs: qué trae adentro. */
  contenido: { nombre: string; cantidad: number; slug: string | null }[];
};

/** Columnas que se pueden mostrar. El resto no sale de la base. */
const RESUMEN = {
  id: true,
  slug: true,
  name: true,
  tagline: true,
  price: true,
  // La miniatura de trabajo interno. Se usa solo como respaldo: ver
  // `aResumen`.
  imageUrl: true,
  storeImages: {
    orderBy: { sortOrder: "asc" },
    take: 1,
    select: { url: true, alt: true },
  },
} as const;

/**
 * Un artículo se muestra si está publicado Y sigue activo.
 *
 * Son dos interruptores distintos y hacen falta los dos: `isActive` es
 * «esto todavía se vende», `isPublic` es «esto se muestra en la web».
 * Algo que se dio de baja no debería seguir apareciendo solo porque
 * alguien se olvidó de despublicarlo.
 */
const VISIBLE = { isPublic: true, isActive: true, slug: { not: null } };

function aResumen(
  tipo: TipoArticulo,
  fila: {
    id: string;
    slug: string | null;
    name: string;
    tagline: string | null;
    price: number;
    imageUrl?: string | null;
    storeImages: { url: string; alt: string | null }[];
  }
): ArticuloResumen {
  return {
    tipo,
    id: fila.id,
    slug: fila.slug!,
    nombre: fila.name,
    tagline: fila.tagline,
    precio: fila.price,
    /*
      La foto de tienda manda. Si no hay, se cae a la miniatura interna
      del panel: no es la definitiva —está hecha para reconocer el
      producto en una lista, no para vender— pero enseñar el producto mal
      iluminado es mejor que enseñar un hueco. En cuanto se suba la buena,
      esta deja de usarse sola.
    */
    imagen: fila.storeImages[0]?.url ?? fila.imageUrl ?? null,
    imagenAlt: fila.storeImages[0]?.alt ?? null,
  };
}

/** El catálogo completo. Los packs primero: son la mejor puerta de entrada. */
export async function listarCatalogo(): Promise<{
  packs: ArticuloResumen[];
  productos: ArticuloResumen[];
}> {
  const [packs, productos] = await Promise.all([
    prisma.pack.findMany({ where: VISIBLE, select: RESUMEN, orderBy: { price: "asc" } }),
    prisma.product.findMany({ where: VISIBLE, select: RESUMEN, orderBy: { name: "asc" } }),
  ]);

  return {
    packs: packs.map((p) => aResumen("pack", p)),
    productos: productos.map((p) => aResumen("producto", p)),
  };
}

/**
 * Busca por dirección pública. Devuelve null si no existe o no está
 * publicado — la tienda responde 404 en los dos casos, que es lo correcto:
 * un artículo despublicado no tiene por qué anunciar que existe.
 */
export async function buscarPorSlug(slug: string): Promise<ArticuloDetalle | null> {
  const detalle = {
    ...RESUMEN,
    description: true,
    storeImages: {
      orderBy: { sortOrder: "asc" },
      select: { url: true, alt: true },
    },
  } as const;

  const producto = await prisma.product.findFirst({
    where: { ...VISIBLE, slug },
    select: { ...detalle, ingredients: true },
  });

  if (producto) {
    return {
      ...aResumen("producto", producto),
      descripcion: producto.description,
      ingredientes: producto.ingredients,
      imagenes: producto.storeImages,
      contenido: [],
    };
  }

  const pack = await prisma.pack.findFirst({
    where: { ...VISIBLE, slug },
    select: {
      ...detalle,
      items: {
        select: {
          quantity: true,
          product: { select: { name: true, slug: true, isPublic: true } },
        },
      },
    },
  });

  if (!pack) return null;

  return {
    ...aResumen("pack", pack),
    descripcion: pack.description,
    ingredientes: null,
    imagenes: pack.storeImages,
    contenido: pack.items.map((i) => ({
      nombre: i.product.name,
      cantidad: i.quantity,
      // Solo se enlaza lo que también está publicado. Un enlace a un
      // producto despublicado lleva a un 404, y eso parece un error del
      // sitio aunque no lo sea.
      slug: i.product.isPublic ? i.product.slug : null,
    })),
  };
}

/**
 * Los precios que valen. Se usa al armar el pedido.
 *
 * El carrito vive en el navegador del cliente, así que los precios que
 * manda son un dato de entrada, no una verdad: cualquiera puede editarlos
 * antes de enviar. Lo único que se acepta de ahí es qué artículo y cuántos;
 * cuánto cuesta se vuelve a leer de la base, siempre.
 */
export async function preciosVigentes(
  refs: { tipo: TipoArticulo; id: string }[]
): Promise<Map<string, { nombre: string; sku: string; precio: number }>> {
  const idsProducto = refs.filter((r) => r.tipo === "producto").map((r) => r.id);
  const idsPack = refs.filter((r) => r.tipo === "pack").map((r) => r.id);

  const [productos, packs] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: idsProducto }, ...VISIBLE },
      select: { id: true, name: true, sku: true, price: true },
    }),
    prisma.pack.findMany({
      where: { id: { in: idsPack }, ...VISIBLE },
      select: { id: true, name: true, sku: true, price: true },
    }),
  ]);

  const mapa = new Map<string, { nombre: string; sku: string; precio: number }>();
  for (const p of productos) {
    mapa.set(`producto:${p.id}`, { nombre: p.name, sku: p.sku, precio: p.price });
  }
  for (const p of packs) {
    mapa.set(`pack:${p.id}`, { nombre: p.name, sku: p.sku, precio: p.price });
  }
  return mapa;
}

/**
 * A dónde se puede enviar y cuánto cuesta.
 *
 * Se muestra en el checkout para que el total no aparezca recién al final.
 * Es la misma tabla que usa el panel: si la dueña cambia una tarifa en
 * Envíos, la tienda cobra la nueva sin que nadie toque código.
 *
 * De cada zona se toma la transportadora más barata que esté activa. Hoy
 * solo hay Servientrega, pero el día que haya dos, elegir la más cara
 * porque quedó primera en la lista sería una sorpresa cara.
 */
export async function opcionesDeEnvio() {
  const zonas = await prisma.shippingZone.findMany({
    orderBy: { isDefault: "desc" },
    select: {
      id: true,
      name: true,
      isDefault: true,
      cantones: true,
      rates: {
        where: { carrier: { isActive: true } },
        orderBy: { price: "asc" },
        take: 1,
        select: { price: true, carrier: { select: { name: true } } },
      },
    },
  });

  return zonas
    .filter((z) => z.rates.length > 0)
    .map((z) => ({
      id: z.id,
      nombre: z.name,
      porDefecto: z.isDefault,
      precio: z.rates[0].price,
      transportadora: z.rates[0].carrier.name,
      cantones: partirCantones(z.cantones),
    }));
}

/** «Quito, Rumiñahui» → ["quito", "rumiñahui"]. En minúsculas, para comparar. */
export function partirCantones(valor: string | null | undefined): string[] {
  if (!valor) return [];
  return valor
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Qué zona corresponde a un cantón.
 *
 * La zona deja de ser una pregunta del formulario y pasa a deducirse de
 * la dirección: quien elige «Manta» está eligiendo «Fuera de Quito», y no
 * tiene sentido dejar que diga otra cosa.
 *
 * Si el cantón no está en ninguna lista, cae en la zona por defecto — que
 * es justo para lo que sirve ser la zona por defecto. Y si no hubiera
 * ninguna marcada, la primera: mejor cobrar un envío que negarse a vender.
 */
export function zonaParaCanton<
  T extends { nombre: string; porDefecto: boolean; cantones: string[] }
>(zonas: T[], canton: string): T | null {
  if (zonas.length === 0) return null;
  const buscado = canton.trim().toLowerCase();

  if (buscado) {
    const exacta = zonas.find((z) => z.cantones.includes(buscado));
    if (exacta) return exacta;
  }

  /*
    Lo que no está en ninguna lista cae en la zona SIN cantones, no en la
    marcada por defecto.

    La diferencia importa y es cara. Hoy «Quito» es la zona por defecto
    —el panel la preselecciona al crear un pedido a mano— y si el
    respaldo fuera esa, un envío a Manta cobraría la tarifa de Quito.
    Perder plata en cada pedido lejano, en silencio.
    
    Una zona sin cantones significa «todo lo demás», que es exactamente
    lo que hace falta aquí. El `porDefecto` queda como último recurso,
    para el caso raro de que todas tengan lista.
  */
  return (
    zonas.find((z) => z.cantones.length === 0) ??
    zonas.find((z) => z.porDefecto) ??
    zonas[0]
  );
}

/**
 * El pedido que ve el cliente, buscado por su token público.
 *
 * Se eligen las columnas a mano, igual que en el catálogo, y por la misma
 * razón: el pedido guarda el costo de producción indirectamente y la
 * dirección de otra gente si uno se equivoca de consulta. Acá solo sale lo
 * que esa persona ya sabe, porque lo escribió ella.
 */
export async function buscarPedidoPorToken(token: string) {
  if (!token) return null;

  const pedido = await prisma.order.findUnique({
    where: { publicToken: token },
    select: {
      orderNumber: true,
      status: true,
      subtotal: true,
      shippingCost: true,
      total: true,
      createdAt: true,
      trackingNumber: true,
      customer: { select: { name: true } },
      carrier: { select: { name: true, trackingUrlTemplate: true } },
      shippingAddress: {
        select: { address: true, city: true, province: true, reference: true },
      },
      items: {
        select: { itemName: true, quantity: true, unitPrice: true, lineTotal: true },
      },
      comprobantes: {
        orderBy: { createdAt: "desc" },
        select: { id: true, tipo: true, createdAt: true },
      },
    },
  });

  if (!pedido) return null;

  const seguimiento =
    pedido.trackingNumber && pedido.carrier?.trackingUrlTemplate
      ? pedido.carrier.trackingUrlTemplate.replace("{tracking}", pedido.trackingNumber)
      : null;

  return { ...pedido, seguimiento };
}

/**
 * Por dónde nos escribe el cliente.
 *
 * Devuelve enlaces ya armados, no números sueltos. El número de WhatsApp
 * se guarda como lo escriba la dueña —con espacios, guiones o un «+»— y
 * wa.me solo acepta dígitos, así que la limpieza se hace acá y no en cada
 * sitio que quiera poner un enlace.
 */
export async function datosDeContacto() {
  const filas = await prisma.setting.findMany({
    where: {
      key: { in: ["contact_whatsapp", "contact_instagram", "contact_tiktok"] },
    },
  });
  const mapa = Object.fromEntries(filas.map((f) => [f.key, f.value]));

  const digitos = (mapa.contact_whatsapp ?? "").replace(/\D/g, "");
  const instagram = (mapa.contact_instagram ?? "").trim().replace(/^@/, "");
  const tiktok = (mapa.contact_tiktok ?? "").trim().replace(/^@/, "");

  return {
    whatsapp: digitos ? `https://wa.me/${digitos}` : null,
    instagram: instagram ? `https://instagram.com/${instagram}` : null,
    instagramUsuario: instagram || null,
    tiktok: tiktok ? `https://tiktok.com/@${tiktok}` : null,
    tiktokUsuario: tiktok || null,
  };
}

/**
 * Quién vende.
 *
 * Sale de Configuración y no de una constante en el código: hoy es una
 * persona natural con cédula, y en cuanto salga el RUC hay que poder
 * cambiarlo sin tocar un archivo ni volver a desplegar.
 *
 * Lo que no esté cargado se devuelve como null y la página se calla en vez
 * de imprimir un hueco. Una ficha de vendedor a medias da menos confianza
 * que una corta.
 */
export async function identidadDelVendedor() {
  const filas = await prisma.setting.findMany({
    where: {
      key: {
        in: ["sender_name", "sender_cedula", "sender_city", "sender_province", "sender_email"],
      },
    },
  });
  const m = Object.fromEntries(filas.map((f) => [f.key, f.value.trim()]));
  const ciudad = [m.sender_city, m.sender_province].filter(Boolean).join(", ");

  return {
    nombre: m.sender_name || "LILUS",
    cedula: m.sender_cedula || null,
    ciudad: ciudad || null,
    email: m.sender_email || null,
  };
}

/**
 * El nombre de la marca, tal como se pinta en la cabecera.
 *
 * Sale de Configuración y no de una constante: es el tipo de cosa que se
 * decide una vez y se cambia sin avisar a nadie, y no debería hacer falta
 * tocar código ni volver a desplegar para corregir una letra.
 */
export async function nombreDeMarca(): Promise<string> {
  const ajuste = await prisma.setting.findUnique({ where: { key: "brand_name" } });
  return ajuste?.value?.trim() || "LILUS";
}

/**
 * La cinta de promoción de arriba del todo.
 *
 * Devuelve null si está apagada o sin texto, y entonces la tienda no
 * pinta la barra en absoluto. Es a propósito: una cinta encendida con el
 * texto vacío dejaría una franja negra sin explicación, y una promoción
 * que ya venció es peor que ninguna.
 */
export async function barraDePromocion(): Promise<{
  texto: string;
  enlace: string | null;
} | null> {
  const filas = await prisma.setting.findMany({
    where: { key: { in: ["promo_activa", "promo_texto", "promo_enlace"] } },
  });
  const m = Object.fromEntries(filas.map((f) => [f.key, f.value.trim()]));

  if (m.promo_activa !== "true") return null;
  const texto = m.promo_texto;
  if (!texto) return null;

  return { texto, enlace: m.promo_enlace || null };
}

/**
 * Los packs, con lo que hace falta para la lista desplegable de la
 * portada: además del resumen, la descripción larga que se revela al
 * pasar el cursor.
 */
export async function listarPacksConDescripcion(): Promise<
  (ArticuloResumen & { descripcion: string | null })[]
> {
  const packs = await prisma.pack.findMany({
    where: VISIBLE,
    select: { ...RESUMEN, description: true },
    orderBy: { price: "asc" },
  });

  return packs.map((p) => ({
    ...aResumen("pack", p),
    descripcion: p.description,
  }));
}

/**
 * Los tres de la portada.
 *
 * Solo los que la dueña marcó. Si no hay ninguno, devuelve lista vacía y
 * la sección no se pinta — a propósito: es una vitrina curada, y sin
 * curar no hay nada que enseñar. Antes salían los tres primeros por orden
 * alfabético, y en una marca de jabones eso ponía de cara el
 * acondicionador y el agua micelar.
 */
export async function listarDestacados(): Promise<ArticuloResumen[]> {
  const filas = await prisma.product.findMany({
    where: { ...VISIBLE, destacado: true },
    select: RESUMEN,
    orderBy: { name: "asc" },
    take: 3,
  });
  return filas.map((f) => aResumen("producto", f));
}

/** Un producto dentro de un pack, con lo que se muestra en la presentación. */
export type ProductoDelPack = {
  id: string;
  slug: string | null;
  nombre: string;
  tagline: string | null;
  /** Texto ya revisado para cumplir la Decisión 516. */
  ingredientes: string | null;
  precio: number;
  cantidad: number;
  imagen: string | null;
};

export type PackPresentacion = {
  id: string;
  slug: string;
  nombre: string;
  tagline: string | null;
  descripcion: string | null;
  precio: number;
  /** Lo que costaría comprando cada cosa por separado. */
  precioSuelto: number;
  ahorro: number;
  imagenes: { url: string; alt: string | null }[];
  contenido: ProductoDelPack[];
};

/**
 * Todo lo que necesita la página de presentación de un pack.
 *
 * ── Lo que NO trae, a propósito ──
 *
 * Los beneficios del recetario. Ese texto está escrito para quien fabrica
 * y dice cosas como «antimicrobiano» o «ayuda a la regeneración», que son
 * justo los claims que la Decisión 516 prohíbe en publicidad. Sacarlos a
 * la web sería publicar de rebote lo que ya se limpió a mano.
 *
 * Lo público es `ingredients` y `tagline`, que ya pasaron esa revisión.
 */
export async function obtenerPackPresentacion(
  slug: string
): Promise<PackPresentacion | null> {
  const pack = await prisma.pack.findFirst({
    where: { ...VISIBLE, slug },
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      description: true,
      price: true,
      imageUrl: true,
      storeImages: { orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } },
      items: {
        select: {
          quantity: true,
          product: {
            select: {
              id: true,
              slug: true,
              name: true,
              tagline: true,
              ingredients: true,
              price: true,
              imageUrl: true,
              isPublic: true,
              storeImages: {
                orderBy: { sortOrder: "asc" },
                take: 1,
                select: { url: true },
              },
            },
          },
        },
      },
    },
  });

  if (!pack) return null;

  const contenido: ProductoDelPack[] = pack.items.map((i) => ({
    id: i.product.id,
    // Solo se enlaza lo que también está publicado: un enlace a un producto
    // despublicado lleva a un 404 y parece un error del sitio.
    slug: i.product.isPublic ? i.product.slug : null,
    nombre: i.product.name,
    tagline: i.product.tagline,
    ingredientes: i.product.ingredients,
    precio: i.product.price,
    cantidad: i.quantity,
    imagen: i.product.storeImages[0]?.url ?? i.product.imageUrl ?? null,
  }));

  const precioSuelto = contenido.reduce((a, c) => a + c.precio * c.cantidad, 0);

  // Si el pack tiene fotos de tienda se usan; si no, la interna sirve de
  // referencia mientras llegan las buenas.
  const imagenes = pack.storeImages.length
    ? pack.storeImages
    : pack.imageUrl
      ? [{ url: pack.imageUrl, alt: null }]
      : [];

  return {
    id: pack.id,
    slug: pack.slug!,
    nombre: pack.name,
    tagline: pack.tagline,
    descripcion: pack.description,
    precio: pack.price,
    precioSuelto,
    ahorro: Math.max(0, precioSuelto - pack.price),
    imagenes,
    contenido,
  };
}

/** Los otros packs, para el cierre de una presentación. */
export async function otrosPacks(slugActual: string): Promise<ArticuloResumen[]> {
  const filas = await prisma.pack.findMany({
    where: { ...VISIBLE, slug: { not: slugActual } },
    select: RESUMEN,
    orderBy: { price: "asc" },
  });
  return filas.map((f) => aResumen("pack", f));
}

/** Las fotos del feed, en el orden que puso la dueña. */
export async function listarFeed() {
  return prisma.feedImagen.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: { id: true, url: true, alt: true, enlace: true },
  });
}

/**
 * Cómo se cobra: el enlace de DeUna y los datos de la cuenta.
 *
 * ── Por qué el enlace no lleva el monto ──
 *
 * Porque hoy no se puede. DeUna sí permite un QR con el monto ya puesto,
 * pero eso exige la integración por API, que a su vez exige cuenta de
 * negocio con RUC y aprobación. Los enlaces de cobro de una cuenta
 * personal se generan a mano en la app, uno por uno: no hay forma de
 * pedirle uno nuevo por cada pedido.
 *
 * Así que se usa un enlace fijo y el monto se muestra en grande al lado,
 * para que la persona lo escriba. Cuando haya RUC y API, este mismo sitio
 * devolverá un enlace por pedido y la página no cambia.
 */
export async function datosDeCobro() {
  const filas = await prisma.setting.findMany({
    where: { key: { in: ["deuna_enlace", "deuna_qr", "bank_details"] } },
  });
  const m = Object.fromEntries(filas.map((f) => [f.key, f.value.trim()]));
  return {
    deuna: m.deuna_enlace || null,
    /*
      La imagen que subió la dueña desde la app del banco.

      Cuando está, manda sobre el código que sabríamos generar a partir
      del enlace: ese sale de una cadena que no tiene por qué ser la misma
      que el QR real que emite la red de pagos, y un código que escanea
      distinto no sirve de nada.
    */
    qrSubido: m.deuna_qr || null,
    banco: m.bank_details || null,
  };
}

/**
 * Imágenes para la página de Nosotros.
 *
 * No hay un sitio donde subir «fotos de la marca», y no lo voy a inventar:
 * sería una pantalla más de administración para tres imágenes que casi
 * nunca cambian. Se toman prestadas del catálogo publicado.
 *
 * Si no hay ninguna, la página se arma igual sin ellas — el texto es lo
 * que sostiene esa página, y un hueco gris donde debería haber una foto
 * se ve peor que no tener foto.
 */
export async function imagenesParaNosotros(cuantas = 3): Promise<string[]> {
  const [productos, packs] = await Promise.all([
    prisma.product.findMany({
      where: { isPublic: true, imageUrl: { not: null } },
      select: { imageUrl: true },
      orderBy: { updatedAt: "desc" },
      take: cuantas * 2,
    }),
    prisma.pack.findMany({
      where: { isPublic: true, imageUrl: { not: null } },
      select: { imageUrl: true },
      take: cuantas,
    }),
  ]);

  /*
    Los packs primero: son fotos de conjunto, con caja y varias barras, y
    dan mejor de fondo grande que la foto suelta de un jabón.
  */
  const todas = [...packs, ...productos]
    .map((f) => f.imageUrl)
    .filter((u): u is string => Boolean(u));

  return [...new Set(todas)].slice(0, cuantas);
}

/** Cifras verdaderas para la página de Nosotros. Nada inventado. */
export async function cifrasDeLaMarca() {
  const [productos, packs, zonas] = await Promise.all([
    prisma.product.count({ where: { isPublic: true } }),
    prisma.pack.count({ where: { isPublic: true } }),
    prisma.shippingZone.count(),
  ]);
  return { productos, packs, zonas };
}
