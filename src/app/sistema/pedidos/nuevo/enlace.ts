"use server";

import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";

/**
 * Un enlace para que la clienta termine el pedido ella misma.
 *
 * ── Qué resuelve ──
 *
 * La venta se acuerda por WhatsApp, y después alguien tiene que escribir
 * la dirección que la otra persona dicta. Ahí se pierden los datos:
 * calles mal transcritas, sin punto en el mapa, sin cédula. Con el
 * enlace, la dirección la escribe quien vive ahí — que es la única que
 * la sabe de verdad — y marca su punto en el mapa con el mismo
 * formulario de la tienda.
 *
 * ── Dos momentos, un mismo mecanismo ──
 *
 * Se puede mandar desde el paso de los productos, cuando todavía no está
 * cerrado qué lleva, o desde el de los datos, cuando ya se acordó. Lo
 * único que cambia es qué va dentro: en el primer caso puede ir vacío o a
 * medias, y quien compra completa; en el segundo va todo y solo faltan
 * sus datos.
 */

/*
  Dos días, igual que la espera de pago.

  Un enlace de la semana pasada abierto por error crearía hoy una venta
  que ya no existe, con los precios de entonces. Y el plazo que ya se le
  promete al cliente en las condiciones de compra es este: usar el mismo
  evita tener dos relojes distintos contando cosas parecidas.
*/
const HORAS_DE_VIDA = 48;

export type EnlaceCreado = {
  token: string;
  /** La dirección completa, o `null` si no hay dirección pública puesta. */
  url: string | null;
  expiraEn: string;
};

export async function crearEnlaceDePedidoAction(
  items: { tipo: "producto" | "pack"; refId: string; cantidad: number }[]
): Promise<{ ok: true; enlace: EnlaceCreado } | { ok: false; error: string }> {
  const user = await requireUser();

  /*
    Se limpian los caducados al crear uno nuevo.

    Es el único momento en que alguien pasa por aquí, y son cuatro filas.
    Un trabajo programado para esto sería más maquinaria que problema.
  */
  await prisma.borradorDePedido
    .deleteMany({ where: { expiraEn: { lt: new Date() }, usadoEn: null } })
    .catch(() => {});

  const limpios = items
    .filter((i) => i.refId && i.cantidad > 0)
    .slice(0, 40)
    .map((i) => ({
      tipo: i.tipo,
      refId: i.refId,
      cantidad: Math.min(i.cantidad, 99),
    }));

  const borrador = await prisma.borradorDePedido.create({
    data: {
      token: randomBytes(24).toString("base64url"),
      expiraEn: new Date(Date.now() + HORAS_DE_VIDA * 3600_000),
      creadoPor: user.name,
      items: { create: limpios },
    },
  });

  /*
    Sin dirección pública no hay enlace que mandar.

    Se devuelve el token igual —para poder decir qué falta y no dejar un
    error mudo— pero la URL va en nulo: un «/pedir/abc…» pegado en
    WhatsApp no es un enlace, es texto que no lleva a ningún lado.
  */
  const base = (process.env.APP_URL ?? "").trim().replace(/\/+$/, "");

  return {
    ok: true,
    enlace: {
      token: borrador.token,
      url: base ? `${base}/pedir/${borrador.token}` : null,
      expiraEn: borrador.expiraEn.toISOString(),
    },
  };
}
