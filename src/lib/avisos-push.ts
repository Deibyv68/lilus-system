import "server-only";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { avisarAppsMoviles } from "@/lib/avisos-fcm";

/**
 * Avisos que llegan al teléfono aunque el panel esté cerrado.
 *
 * ── Por qué esto y no un correo ──
 *
 * El correo ya existe (`avisos-pedido.ts`) y seguirá saliendo, pero un
 * correo hay que ir a mirarlo. Una venta que entra a las once de la noche
 * necesita sonar, y para eso está el push: es la misma notificación que
 * manda WhatsApp, entregada por Google o Apple, sin pagar nada y sin
 * depender de que la app esté abierta.
 *
 * ── Cómo funciona, en corto ──
 *
 * El navegador se suscribe y entrega tres cosas: una dirección (endpoint,
 * que es de Google o de Apple, no nuestra) y dos claves suyas. Nosotros
 * dejamos el aviso cifrado en esa dirección, firmado con nuestras claves
 * VAPID para demostrar que somos quienes decimos. El teléfono lo recoge
 * cuando puede.
 *
 * O sea: el aviso viaja cifrado de punta a punta. Ni Google ni Apple ven
 * qué dice, solo a qué aparato entregarlo.
 *
 * ── Las claves VAPID ──
 *
 * Son un par, se generan UNA vez y van en el `.env`:
 *
 *   npx tsx scripts/generar-claves-push.ts
 *
 * La pública viaja al navegador; la privada no sale del servidor. Si se
 * cambian, todas las suscripciones existentes dejan de valer y hay que
 * volver a activar los avisos en cada aparato — así que se generan una
 * vez y se guardan bien.
 *
 * Sin claves configuradas esto no revienta: no manda nada y lo dice en el
 * log. Un aviso que no sale nunca puede tumbar una venta.
 */

const PUBLICA = process.env.VAPID_PUBLIC_KEY?.trim();
const PRIVADA = process.env.VAPID_PRIVATE_KEY?.trim();

/** El «quién manda esto» que exige el estándar. Vale un mailto. */
const CONTACTO = process.env.VAPID_SUBJECT?.trim() || "mailto:lilus@example.com";

export function pushConfigurado(): boolean {
  return Boolean(PUBLICA && PRIVADA);
}

let listo = false;
function configurar(): boolean {
  if (!pushConfigurado()) return false;
  if (!listo) {
    webpush.setVapidDetails(CONTACTO, PUBLICA!, PRIVADA!);
    listo = true;
  }
  return true;
}

export type AvisoPush = {
  titulo: string;
  cuerpo: string;
  /** A dónde lleva al tocarla. Ruta relativa: `/sistema/pedidos`. */
  url?: string;
  /**
   * Agrupa avisos. Dos con la misma etiqueta se reemplazan en vez de
   * apilarse — útil para que tres pedidos seguidos no dejen tres
   * notificaciones idénticas si nadie las tocó.
   */
  grupo?: string;
};

/**
 * Manda el aviso a todos los aparatos registrados.
 *
 * Devuelve a cuántos llegó. No lanza: quien lo llama está en medio de
 * guardar un pedido y no puede permitirse que un aviso lo tumbe.
 */
export async function avisarPorPush(aviso: AvisoPush): Promise<number> {
  if (!configurar()) {
    console.warn("[push] Sin claves VAPID configuradas — no se mandó nada.");
    return 0;
  }

  const subs = await prisma.pushSubscription.findMany();
  if (subs.length === 0) return 0;

  const carga = JSON.stringify({
    titulo: aviso.titulo,
    cuerpo: aviso.cuerpo,
    url: aviso.url ?? "/sistema/pedidos",
    grupo: aviso.grupo ?? "lilus",
  });

  /*
    En paralelo y sin cortar en el primer fallo: que el celular de una
    persona esté apagado no puede impedir que le llegue a la otra.
  */
  const resultados = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        {
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth },
        },
        carga,
        { TTL: 60 * 60 * 12 } // si en 12 h no se pudo entregar, ya no sirve
      )
    )
  );

  const muertas: string[] = [];
  let entregados = 0;

  resultados.forEach((r, i) => {
    if (r.status === "fulfilled") {
      entregados++;
      return;
    }
    /*
      404 y 410 significan que esa suscripción ya no existe: la app se
      desinstaló, o el navegador limpió sus datos. Se borran acá mismo,
      porque si no la lista crece con direcciones muertas a las que se
      intenta escribir en cada venta.

      Cualquier otro error puede ser pasajero —el servicio de push caído,
      la red— y esas se dejan en paz.
    */
    const codigo = (r.reason as { statusCode?: number })?.statusCode;
    if (codigo === 404 || codigo === 410) {
      muertas.push(subs[i].endpoint);
    } else {
      console.error("[push] No se pudo entregar:", codigo ?? r.reason);
    }
  });

  if (muertas.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: muertas } },
    });
    console.log(`[push] ${muertas.length} suscripción(es) caducada(s) borrada(s).`);
  }

  return entregados;
}

/**
 * El aviso concreto de una venta nueva.
 *
 * Sale por los dos caminos a la vez: Web Push para la PWA y Firebase
 * para la app de Android. Son transportes distintos —el porqué está en
 * `avisos-fcm.ts`— y quien tenga los dos recibirá dos avisos, que es
 * mejor que la alternativa de tener que elegir cuál falla menos.
 *
 * Devuelve cuántos avisos salieron, sumando ambos.
 */
export async function avisarVentaNueva(p: {
  orderNumber: string;
  clienteNombre: string;
  total: number;
  items: number;
}): Promise<number> {
  const money = new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
  }).format(p.total);

  const titulo = `Venta nueva · ${money}`;
  const cuerpo =
    `${p.clienteNombre} · ${p.items} ${p.items === 1 ? "ítem" : "ítems"}. ` +
    "Falta revisar que la transferencia entró.";

  const [web, app] = await Promise.all([
    avisarPorPush({
      titulo,
      cuerpo,
      url: "/sistema/pedidos",
      grupo: "venta-nueva",
    }),
    avisarAppsMoviles({
      titulo,
      cuerpo,
      ruta: "/pedidos",
      grupo: "venta-nueva",
    }),
  ]);

  return web + app;
}

/**
 * Alguien subió su comprobante.
 *
 * Es el aviso que de verdad hace avanzar un pedido: significa que hay
 * algo que mirar y una venta que se puede confirmar. Va por los dos
 * caminos, igual que la venta nueva.
 */
export async function avisarComprobante(p: {
  orderNumber: string;
  clienteNombre: string;
}): Promise<number> {
  const titulo = "Comprobante recibido";
  const cuerpo = `${p.clienteNombre} subió el suyo · ${p.orderNumber}. Revísalo y confirma el pago.`;

  const [web, app] = await Promise.all([
    avisarPorPush({ titulo, cuerpo, url: "/sistema/pedidos", grupo: "comprobante" }),
    avisarAppsMoviles({ titulo, cuerpo, ruta: "/pedidos", grupo: "comprobante" }),
  ]);

  return web + app;
}
