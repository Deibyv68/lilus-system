"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Link2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { crearEnlaceDePedidoAction, type EnlaceCreado } from "./enlace";

/**
 * «Que lo llene ella» — el botón que genera el enlace y lo deja listo
 * para pegar en la conversación.
 *
 * ── Por qué en dos sitios del asistente ──
 *
 * Porque hay dos momentos distintos en una conversación de WhatsApp.
 *
 * Cuando todavía se está viendo qué llevar, el enlace va con lo que haya
 * elegido hasta ahí —o vacío— y quien compra termina de elegir.
 *
 * Cuando ya se acordó qué lleva, el enlace va completo y lo único que
 * falta son sus datos: nombre, cédula, dirección y el punto del mapa.
 *
 * El mecanismo es el mismo; cambia lo que va dentro y lo que dice el
 * mensaje. Tener un solo botón obligaría a elegir uno de los dos momentos
 * y perder el otro.
 */
export function BotonEnlace({
  items,
  momento,
}: {
  items: { tipo: "producto" | "pack"; refId: string; cantidad: number }[];
  /** Cambia el texto, no lo que hace. */
  momento: "productos" | "datos";
}) {
  const [enlace, setEnlace] = useState<EnlaceCreado | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [creando, empezar] = useTransition();

  function crear() {
    empezar(async () => {
      const r = await crearEnlaceDePedidoAction(items);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setEnlace(r.enlace);
    });
  }

  async function copiar() {
    if (!enlace?.url) return;
    try {
      await navigator.clipboard.writeText(enlace.url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("No se pudo copiar. Mantén pulsado el enlace y cópialo.");
    }
  }

  const mensaje = enlace?.url
    ? momento === "datos"
      ? `¡Hola! 🌸 Aquí puedes completar tu pedido con tus datos de entrega:\n${enlace.url}\n\nEl enlace vale por dos días.`
      : `¡Hola! 🌸 Aquí puedes elegir lo que quieras y dejarnos tus datos:\n${enlace.url}\n\nEl enlace vale por dos días.`
    : "";

  if (!enlace) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={crear}
        disabled={creando}
      >
        <Link2 className="size-4" />
        {creando
          ? "Creando…"
          : momento === "datos"
            ? "Que ella llene sus datos"
            : "Mandarle un enlace para que elija"}
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <p className="text-sm font-medium">Enlace listo</p>

      {enlace.url ? (
        <>
          <p className="break-all rounded-md border bg-background px-3 py-2 font-mono text-xs">
            {enlace.url}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={copiar}>
              {copiado ? (
                <Check className="size-3.5 text-emerald-600" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copiado ? "Copiado" : "Copiar"}
            </Button>

            {/*
              Sin número: abre WhatsApp para elegir con quién.

              Este botón se toca desde la conversación que ya está abierta,
              y en ese momento todavía no se ha escrito el teléfono de la
              clienta en el formulario — el paso del cliente puede venir
              después. Dejar que WhatsApp pregunte a quién es más rápido
              que obligar a rellenar el teléfono aquí primero.
            */}
            <Button asChild variant="outline" size="sm">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="size-3.5" /> Mandar por WhatsApp
              </a>
            </Button>
          </div>

          <p className="text-2xs text-muted-foreground">
            Vale por dos días. Cuando lo complete, el pedido aparece aquí
            solo.
          </p>
        </>
      ) : (
        /*
          Sin `APP_URL` no hay enlace que mandar, y decirlo es mejor que
          dar una ruta relativa que en WhatsApp no lleva a ningún lado.
        */
        <p className="text-xs leading-relaxed text-muted-foreground">
          El enlace se creó, pero no se puede armar la dirección completa
          porque falta configurar la dirección pública de la tienda
          (<code>APP_URL</code>) en la laptop. Hasta entonces, este camino
          no sirve.
        </p>
      )}
    </div>
  );
}
