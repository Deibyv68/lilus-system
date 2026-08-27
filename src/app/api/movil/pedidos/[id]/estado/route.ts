import { NextRequest } from "next/server";
import { conSesion, json } from "@/lib/auth-movil";
import {
  cambiarEstadoDePedido,
  esEstadoValido,
} from "@/lib/cambiar-estado";
import { etiquetaDeEstado } from "@/lib/estados-pedido";

export const dynamic = "force-dynamic";

/**
 * Mover un pedido de estado desde la app.
 *
 * El caso real es uno: la dueña ve el aviso, mira el banco, y marca
 * «Pagado» sin sentarse a la computadora. Los demás estados vienen
 * gratis y se dejan por si acaso.
 *
 * El trabajo lo hace `cambiarEstadoDePedido`, el mismo que usa el panel.
 * Esta ruta solo comprueba quién pide y que el estado sea uno de los que
 * existen.
 */
export const POST = conSesion(
  async (req: NextRequest, _usuario, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params;

    let cuerpo: { estado?: unknown; guia?: unknown };
    try {
      cuerpo = await req.json();
    } catch {
      return json({ error: "Cuerpo inválido" }, 400);
    }

    const estado = String(cuerpo.estado ?? "");
    if (!esEstadoValido(estado)) {
      return json({ error: `Estado desconocido: ${estado}` }, 400);
    }

    const guia = cuerpo.guia == null ? undefined : String(cuerpo.guia);
    const r = await cambiarEstadoDePedido(id, estado, { guia });
    if (!r.ok) return json({ error: r.error }, 400);

    return json({ ok: true, estado, estadoTexto: etiquetaDeEstado(estado) });
  }
);
