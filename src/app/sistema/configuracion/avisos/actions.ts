"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { pushConfigurado, avisarPorPush } from "@/lib/avisos-push";

/**
 * Alta y baja de los avisos push, por aparato.
 *
 * Quien manda es el navegador: él genera la suscripción cuando la persona
 * acepta el permiso, y nosotros solo la guardamos. Por eso acá no hay
 * ninguna lógica de «activar»: lo único que se puede hacer desde el
 * servidor es recordar lo que el navegador ya decidió.
 */

export type SuscripcionEntrante = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

/** Guarda —o refresca— la suscripción de este aparato. */
export async function guardarSuscripcionAction(
  sub: SuscripcionEntrante,
  etiqueta: string
) {
  const user = await requireUser();

  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return { ok: false as const, error: "El navegador no entregó una suscripción válida" };
  }

  /*
    El endpoint es la llave.

    Un mismo navegador puede pedir la suscripción varias veces —al
    reinstalar la app, al volver a dar permiso— y cada vez devuelve el
    mismo endpoint. Si se creara una fila nueva, el aviso saldría
    duplicado y el teléfono sonaría dos veces por la misma venta.
  */
  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: {
      userId: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      etiqueta: etiqueta.slice(0, 60) || null,
    },
    update: {
      userId: user.id,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      lastSeenAt: new Date(),
    },
  });

  return { ok: true as const };
}

/** Da de baja este aparato. */
export async function borrarSuscripcionAction(endpoint: string) {
  await requireUser();
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  return { ok: true as const };
}

/**
 * Manda un aviso de prueba.
 *
 * Existe porque el push falla en silencio de mil maneras —permiso
 * denegado a nivel del sistema, batería optimizando la app, claves mal
 * pegadas— y ninguna se ve hasta que entra una venta de verdad y nadie
 * se entera. Mejor descubrirlo apretando un botón.
 */
export async function probarAvisoAction() {
  await requireUser();

  if (!pushConfigurado()) {
    return {
      ok: false as const,
      error: "Faltan las claves VAPID en el .env del servidor",
    };
  }

  const cuantos = await avisarPorPush({
    titulo: "Prueba de LILUS",
    cuerpo: "Si ves esto, los avisos de venta nueva van a llegar igual.",
    grupo: "prueba",
  });

  if (cuantos === 0) {
    return {
      ok: false as const,
      error: "No hay ningún aparato con los avisos activados",
    };
  }

  return { ok: true as const, cuantos };
}
