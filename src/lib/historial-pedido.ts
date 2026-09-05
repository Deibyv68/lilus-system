import "server-only";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/guard";
import { etiquetaDeEstado } from "./estados-pedido";
import { formatCurrency } from "./format";
import type {
  ClaseDeMensaje,
  EntradaDelHistorial,
  TipoDeEvento,
} from "./eventos-pedido";

/**
 * El historial de un pedido: qué le fue pasando y cuándo.
 *
 * ── De dónde sale ──
 *
 * De dos sitios, y esa es la idea. Los actos que no dejan rastro en
 * ninguna otra tabla —mover el estado, preparar un mensaje, anotar la
 * guía— se guardan en `EventoDePedido`. Lo que YA está guardado en otro
 * lado —cuándo se creó el pedido, cuándo entró un comprobante, cuándo lo
 * revisaron— no se copia: se lee de donde vive y se mezcla aquí.
 *
 * El motivo es concreto: los pedidos que ya existían no tienen ni una
 * fila de eventos. Si el historial solo mirase esa tabla, todos ellos
 * saldrían vacíos y la función nacería inútil justo para los pedidos que
 * ya hay. Mezclando, un pedido viejo enseña igual cuándo entró y qué
 * comprobantes tuvo.
 */

/**
 * Anotar que pasó algo.
 *
 * ── Por qué nunca lanza ──
 *
 * Esto acompaña a otra cosa que sí importa: cambiar un estado, mandar un
 * correo. Si la anotación fallara y arrastrase consigo la operación,
 * habríamos cambiado «se perdió una línea del historial» por «no se pudo
 * marcar el pedido como enviado». El historial es el testigo, no el
 * acto: si el testigo se cae, el acto sigue.
 */
export async function anotarEvento(
  orderId: string,
  tipo: TipoDeEvento,
  datos: { estado?: string; mensaje?: string; detalle?: string } = {}
): Promise<void> {
  try {
    /*
      Quién lo hizo se averigua aquí y no se pide al que llama.

      Así funciona igual por las dos puertas: el panel web tiene sesión y
      queda firmado; la app de Android entra por su propio camino y queda
      sin firmar, que es honesto. Pedirlo por parámetro habría obligado a
      acordarse en cada sitio, y el día que alguien se olvide el evento
      se anota mintiendo sobre su autor.
    */
    const usuario = await currentUser().catch(() => null);
    await prisma.eventoDePedido.create({
      data: {
        orderId,
        tipo,
        estado: datos.estado ?? null,
        mensaje: datos.mensaje ?? null,
        detalle: datos.detalle ?? null,
        usuarioId: usuario?.id ?? null,
      },
    });
  } catch (e) {
    console.error("[historial] No se pudo anotar el evento", tipo, orderId, e);
  }
}

/*
  Cómo se lee cada mensaje en la lista.

  Dice «preparado» y no «enviado», y eso NO es timidez: el sistema abre
  WhatsApp con el texto dentro y ahí se acaba lo que sabe. Si después se
  envió, se borró o se cerró la app sin mandarlo es algo que solo sabe
  quien tenía el teléfono en la mano. Poner «enviado» convertiría el
  único sitio donde alguien va a comprobar si avisó en el sitio donde el
  sistema le miente.
*/
const TITULO_DE_MENSAJE: Record<ClaseDeMensaje, string> = {
  estado: "Mensaje de estado preparado",
  cobro: "Mensaje de cobro preparado",
};

/*
  Cómo se llama cada correo automático en la lista.

  Se guarda la clase y no el título ya escrito porque el texto se va a
  retocar —siempre se retoca— y un historial que enseña el texto viejo
  junto al nuevo se lee como si fueran cosas distintas.
*/
const NOMBRE_DE_CORREO: Record<string, string> = {
  confirmacion: "Correo de confirmación",
  pago: "Correo de pago confirmado",
  envio: "Correo de envío",
};

export async function historialDelPedido(
  orderId: string
): Promise<EntradaDelHistorial[]> {
  const [pedido, eventos, comprobantes] = await Promise.all([
    prisma.order.findUnique({
      where: { id: orderId },
      select: { createdAt: true, source: true },
    }),
    prisma.eventoDePedido.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        tipo: true,
        estado: true,
        mensaje: true,
        detalle: true,
        createdAt: true,
        usuario: { select: { name: true } },
      },
    }),
    prisma.comprobanteDePago.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        createdAt: true,
        aceptado: true,
        montoConfirmado: true,
        revisadoEn: true,
        revisadoPor: true,
      },
    }),
  ]);

  if (!pedido) return [];

  const lineas: EntradaDelHistorial[] = [];

  lineas.push({
    id: "creado",
    cuando: pedido.createdAt.toISOString(),
    icono: "creado",
    titulo: "Pedido creado",
    detalle: pedido.source ? `Entró por ${pedido.source}` : null,
  });

  for (const e of eventos) {
    const porQuien = e.usuario?.name ?? null;

    if (e.tipo === "ESTADO" && e.estado) {
      lineas.push({
        id: e.id,
        cuando: e.createdAt.toISOString(),
        icono: "estado",
        titulo: etiquetaDeEstado(e.estado),
        porQuien,
        tono:
          e.estado === "DELIVERED"
            ? "bueno"
            : e.estado === "CANCELLED"
              ? "malo"
              : "normal",
      });
      continue;
    }

    if (e.tipo === "MENSAJE") {
      const clase = (e.mensaje ?? "estado") as ClaseDeMensaje;
      lineas.push({
        id: e.id,
        cuando: e.createdAt.toISOString(),
        icono: "mensaje",
        titulo: TITULO_DE_MENSAJE[clase] ?? "Mensaje preparado",
        detalle: e.detalle,
        porQuien,
      });
      continue;
    }

    if (e.tipo === "GUIA") {
      lineas.push({
        id: e.id,
        cuando: e.createdAt.toISOString(),
        icono: "guia",
        titulo: "Guía anotada",
        detalle: e.detalle,
        porQuien,
      });
      continue;
    }

    if (e.tipo === "CORREO") {
      /*
        El correo sí sabe si salió: lo manda el sistema y le contestan.
        Es el único de la lista que puede decir «enviado» sin mentir.
      */
      const salio = e.detalle !== "fallo";
      const cual = NOMBRE_DE_CORREO[e.mensaje ?? "confirmacion"] ?? "Correo";
      lineas.push({
        id: e.id,
        cuando: e.createdAt.toISOString(),
        icono: "correo",
        titulo: salio ? `${cual} enviado` : `${cual}: no salió`,
        tono: salio ? "bueno" : "aviso",
      });
    }
  }

  for (const c of comprobantes) {
    lineas.push({
      id: `c-${c.id}`,
      cuando: c.createdAt.toISOString(),
      icono: "comprobante",
      titulo: "Comprobante subido",
    });

    if (c.revisadoEn && c.aceptado !== null) {
      lineas.push({
        id: `r-${c.id}`,
        cuando: c.revisadoEn.toISOString(),
        icono: c.aceptado ? "revisado" : "descartado",
        titulo: c.aceptado ? "Comprobante confirmado" : "Comprobante descartado",
        detalle:
          c.aceptado && c.montoConfirmado != null
            ? formatCurrency(c.montoConfirmado)
            : null,
        porQuien: c.revisadoPor,
        tono: c.aceptado ? "bueno" : "aviso",
      });
    }
  }

  /*
    Del más viejo al más nuevo: se lee como lo que es, una historia.

    Y con desempate por el orden en que se armaron, porque dos cosas del
    mismo segundo —cambiar el estado y anotar la guía salen del mismo
    gesto— quedarían barajadas al azar en cada carga, y una lista que se
    reordena sola cada vez que entras no parece un historial.
  */
  return lineas
    .map((l, i) => ({ l, i }))
    .sort((a, b) =>
      a.l.cuando === b.l.cuando
        ? a.i - b.i
        : a.l.cuando < b.l.cuando
          ? -1
          : 1
    )
    .map(({ l }) => l);
}
