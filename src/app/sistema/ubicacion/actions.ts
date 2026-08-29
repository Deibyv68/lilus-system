"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";

/**
 * Pegarle a un pedido la ubicación que llegó desde otra app.
 *
 * ── Qué toca y qué no ──
 *
 * El punto siempre: latitud, longitud y, si se sabe, el código postal.
 * Eso mejora el reparto y no le cuesta nada a nadie.
 *
 * La dirección escrita, solo si se pidió. Quien comparte una ubicación
 * casi siempre lo hace porque lo escrito no sirve, pero reemplazarlo sin
 * preguntar tampoco vale: «De las Alondras y De los Quindes» es como se
 * llama el sitio para quien vive ahí, y el mapa puede devolver la
 * avenida grande de al lado — correcta, e inútil para llegar. Por eso lo
 * decide quien mira, en la pantalla anterior.
 *
 * NO toca la zona ni el costo del envío, aunque el punto caiga en otro
 * cantón. Ese pedido ya existe y su total ya se le dijo a la clienta —
 * puede que hasta lo haya pagado. Cambiarle el precio por una ubicación
 * que llegó después sería moverle el suelo sin avisar. Si de verdad hay
 * que cobrar otro envío, eso es una conversación, no un cálculo.
 */

type Resultado = { ok: true } | { ok: false; error: string };

export async function engancharUbicacionAction(
  orderId: string,
  lat: number,
  lng: number,
  postal: string | null,
  /** La calle del mapa, solo si se pidió reemplazar la escrita. */
  calle: string | null
): Promise<Resultado> {
  await requireUser();

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false, error: "Esas coordenadas no se entienden" };
  }

  const pedido = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, shippingAddressId: true, publicToken: true },
  });
  if (!pedido) return { ok: false, error: "Ese pedido ya no existe" };
  if (!pedido.shippingAddressId) {
    return { ok: false, error: "Ese pedido no tiene dirección de envío" };
  }

  await prisma.shippingAddress.update({
    where: { id: pedido.shippingAddressId },
    data: {
      lat,
      lng,
      /*
        El postal solo se escribe si viene. Borrar el que había porque
        esta vez no se supo dejaría peor la dirección que antes.
      */
      ...(postal ? { postal } : {}),
      /*
        Lo mismo con la calle: solo si viene. Un `null` aquí significa
        «no la reemplaces», no «bórrala» — dejar el pedido sin dirección
        escrita sería peor que dejarlo con una regular.
      */
      ...(calle?.trim() ? { address: calle.trim() } : {}),
    },
  });

  revalidatePath(`/sistema/pedidos/${pedido.id}`);
  if (pedido.publicToken) revalidatePath(`/pedido/${pedido.publicToken}`);

  redirect(`/sistema/pedidos/${pedido.id}`);
}
