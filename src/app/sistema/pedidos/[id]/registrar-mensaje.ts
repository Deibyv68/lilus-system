"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/guard";
import { anotarEvento } from "@/lib/historial-pedido";
import { esClaseDeMensaje } from "@/lib/eventos-pedido";

/**
 * Dejar constancia de que se preparó un mensaje para la clienta.
 *
 * ── Por qué hace falta una acción para esto ──
 *
 * Los mensajes se arman en el navegador y se abren con `window.open`
 * hacia WhatsApp. El servidor no se entera de nada. Sin esta llamada, la
 * pregunta «¿ya le avisé a esta señora?» solo se puede contestar
 * revisando el chat, que es justo lo que el historial venía a evitar.
 *
 * ── Lo que esto NO promete ──
 *
 * Que el mensaje se envió. Se anota que se preparó y se abrió WhatsApp;
 * lo que pasó después de eso está fuera del alcance de cualquier cosa
 * que podamos programar aquí. En pantalla dice «preparado» por eso
 * mismo.
 */
export async function registrarMensajeAction(
  orderId: string,
  clase: string
): Promise<void> {
  await requireUser();

  /*
    Si la clase llega rara, se anota igual como mensaje de estado.

    Perder la línea entera por no reconocer una etiqueta sería el peor
    canje posible: el historial existe para que no falten cosas.
  */
  const limpia = esClaseDeMensaje(clase) ? clase : "estado";

  await anotarEvento(orderId, "MENSAJE", { mensaje: limpia });
  revalidatePath(`/sistema/pedidos/${orderId}`);
}
