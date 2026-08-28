"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { anotarComprobante } from "@/lib/anotar-comprobante";

/**
 * Revisar un comprobante: decir qué dice de verdad, o que no cuenta.
 *
 * ── Por qué hace falta un paso humano ──
 *
 * El OCR llena los campos solo, y esos campos están a un clic de parecer
 * un hecho. No lo son: un comprobante es una imagen, y una imagen se
 * edita en dos minutos desde el teléfono.
 *
 * Así que lo que lee la máquina se guarda aparte y no suma nada. Suma lo
 * que escribe quien miró la imagen con el estado de cuenta del banco al
 * lado. La lectura solo ahorra el tecleo: viene puesta en el formulario,
 * y confirmarla es un botón cuando está bien.
 *
 * ── Por qué se puede reabrir ──
 *
 * Porque uno se equivoca al revisar, y la alternativa a corregir sería
 * borrar el comprobante — perdiendo la imagen, que es la única prueba
 * que hay de nada.
 */

type Resultado = { ok: true } | { ok: false; error: string };

/**
 * El monto, tal como lo escribió una persona.
 *
 * Se aceptan coma y punto porque en Ecuador se escriben las dos, y el
 * teclado del teléfono ofrece una u otra según la app. Rechazar «25,50»
 * por la coma sería castigar a quien escribe como se habla aquí.
 */
function leerMonto(crudo: string): number | null {
  const limpio = crudo.trim().replace(/[$\s]/g, "").replace(",", ".");
  if (!limpio) return null;
  const n = Number(limpio);
  if (!Number.isFinite(n) || n <= 0 || n > 100000) return null;
  return Math.round(n * 100) / 100;
}

export async function confirmarComprobanteAction(
  id: string,
  datos: { monto: string; numero: string; fecha: string; banco: string }
): Promise<Resultado> {
  const user = await requireUser();

  /*
    Sin monto no se puede aceptar.

    El monto es lo único que este paso aporta a la aritmética del pedido:
    aceptar un comprobante «por $nada» dejaría el pedido igual de
    incompleto pero con aspecto de resuelto, que es peor que no revisarlo.
  */
  const monto = leerMonto(datos.monto);
  if (monto === null) {
    return {
      ok: false,
      error: "Escribe cuánto dice el comprobante, mirando la imagen.",
    };
  }

  const comprobante = await prisma.comprobanteDePago.findUnique({
    where: { id },
    select: { orderId: true, order: { select: { publicToken: true } } },
  });
  if (!comprobante) return { ok: false, error: "Ese comprobante ya no está" };

  await prisma.comprobanteDePago.update({
    where: { id },
    data: {
      aceptado: true,
      montoConfirmado: monto,
      numeroConfirmado: datos.numero.trim() || null,
      fechaConfirmada: datos.fecha.trim() || null,
      bancoConfirmado: datos.banco.trim() || null,
      revisadoEn: new Date(),
      revisadoPor: user.name,
    },
  });

  refrescar(comprobante.orderId, comprobante.order.publicToken);
  return { ok: true };
}

/**
 * Marcar que un comprobante no cuenta.
 *
 * Pasa más de lo que parece: alguien manda por error el comprobante de
 * otra compra, o una captura del saldo en vez de la transferencia. No es
 * un fraude ni hay que borrar nada — simplemente no suma.
 *
 * La imagen se queda. Si después hay una discusión sobre qué se mandó y
 * cuándo, borrarla habría sido tirar la única prueba.
 */
export async function descartarComprobanteAction(id: string): Promise<Resultado> {
  const user = await requireUser();

  const comprobante = await prisma.comprobanteDePago.findUnique({
    where: { id },
    select: { orderId: true, order: { select: { publicToken: true } } },
  });
  if (!comprobante) return { ok: false, error: "Ese comprobante ya no está" };

  await prisma.comprobanteDePago.update({
    where: { id },
    data: {
      aceptado: false,
      montoConfirmado: null,
      revisadoEn: new Date(),
      revisadoPor: user.name,
    },
  });

  refrescar(comprobante.orderId, comprobante.order.publicToken);
  return { ok: true };
}

/** Volver a dejarlo sin revisar, para corregir una revisión equivocada. */
export async function reabrirComprobanteAction(id: string): Promise<Resultado> {
  await requireUser();

  const comprobante = await prisma.comprobanteDePago.findUnique({
    where: { id },
    select: { orderId: true, order: { select: { publicToken: true } } },
  });
  if (!comprobante) return { ok: false, error: "Ese comprobante ya no está" };

  await prisma.comprobanteDePago.update({
    where: { id },
    data: {
      aceptado: null,
      montoConfirmado: null,
      numeroConfirmado: null,
      fechaConfirmada: null,
      bancoConfirmado: null,
      revisadoEn: null,
      revisadoPor: null,
    },
  });

  refrescar(comprobante.orderId, comprobante.order.publicToken);
  return { ok: true };
}

/*
  La página del cliente también cambia.

  Ahí es donde ve «recibimos $12,00, faltan $13,50». Si no se revalida,
  quien acaba de mandar el segundo abono sigue viendo que debe todo, y
  escribe para preguntar — que es justo la llamada que esta pantalla
  existe para ahorrar.
*/
function refrescar(orderId: string, publicToken: string | null) {
  revalidatePath(`/sistema/pedidos/${orderId}`);
  revalidatePath("/sistema/pedidos");
  revalidatePath("/sistema");
  if (publicToken) revalidatePath(`/pedido/${publicToken}`);
}

/**
 * Subir un comprobante desde el panel.
 *
 * ── Por qué hacía falta ──
 *
 * Un pedido cargado a mano no tiene página pública: nace sin token
 * porque no se comparte con nadie. Y un pedido de la web puede tener
 * cliente que prefiere mandar la captura por WhatsApp, como hace la
 * mayoría. En los dos casos la imagen llegaba al teléfono de la dueña y
 * no había dónde ponerla — se quedaba en una conversación, que es donde
 * las cosas se pierden.
 *
 * ── En qué se diferencia de la del cliente ──
 *
 * No exige que el pedido esté pendiente: la captura puede llegar tarde,
 * después de haberlo dado por pagado mirando el banco, y guardarla sigue
 * valiendo la pena.
 *
 * No tiene tope de cinco. Ese tope existe para que alguien con el enlace
 * no llene el disco; aquí hay una sesión detrás.
 *
 * Y no manda aviso al teléfono: el aviso es para enterarse de que llegó
 * un comprobante, y aquí lo está subiendo justamente quien se enteraría.
 */
export async function subirComprobanteEnPanelAction(
  orderId: string,
  formData: FormData
): Promise<Resultado> {
  await requireUser();

  const pedido = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, publicToken: true },
  });
  if (!pedido) return { ok: false, error: "Ese pedido ya no existe" };

  const anotado = await anotarComprobante(pedido.id, formData.get("comprobante"));
  if (!anotado.ok) return { ok: false, error: anotado.error };

  refrescar(pedido.id, pedido.publicToken);
  return { ok: true };
}
