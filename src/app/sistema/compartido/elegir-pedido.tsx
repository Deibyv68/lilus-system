"use client";

import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { colorDeEstado, etiquetaDeEstado } from "@/lib/estados-pedido";
import { EtiquetaDePago } from "@/components/etiqueta-de-pago";
import type { ComprobanteParaContar } from "@/lib/pago-del-pedido";
import { engancharCompartidoAction } from "./actions";

type Pedido = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  cliente: string;
  comprobantes: ComprobanteParaContar[];
};

/**
 * La lista para elegir el pedido, con la vista previa de lo compartido.
 *
 * ── Por qué se enseña la imagen ──
 *
 * Porque quien llega aquí lo hace desde el menú de compartir de otra app,
 * y en ese salto es fácil mandar la foto equivocada — el chat tiene
 * veinte. Verla arriba confirma en un vistazo que es la que se quería
 * antes de engancharla a un pedido.
 *
 * ── El buscador ──
 *
 * Treinta pedidos no caben en una pantalla de teléfono. Quien acaba de
 * hablar con la clienta tiene su nombre fresco, así que escribirlo es más
 * rápido que desplazarse buscando el número.
 */
export function ElegirPedido({
  archivo,
  tipo,
  bytes,
  pedidos,
}: {
  archivo: string;
  tipo: string;
  bytes: number;
  pedidos: Pedido[];
}) {
  const [texto, setTexto] = useState("");
  const [enganchando, empezar] = useTransition();

  const busca = texto.trim().toLowerCase();
  const visibles = busca
    ? pedidos.filter(
        (p) =>
          p.cliente.toLowerCase().includes(busca) ||
          p.orderNumber.toLowerCase().includes(busca)
      )
    : pedidos;

  function elegir(p: Pedido) {
    empezar(async () => {
      const r = await engancharCompartidoAction(p.id, archivo, tipo, bytes);
      /*
        Si todo va bien la acción redirige y esto no llega a ejecutarse.
        Solo se ve el aviso cuando algo falló.
      */
      if (r && !r.ok) toast.error(r.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-muted/30 p-3">
        <p className="mb-2 text-xs text-muted-foreground">Lo que compartiste</p>
        {tipo === "application/pdf" ? (
          <p className="rounded-md border bg-background px-3 py-6 text-center text-sm">
            Comprobante en PDF
          </p>
        ) : (
          /*
            Con <img> y no con next/image: el optimizador pediría la imagen
            desde el servidor, sin la cookie de sesión, y la ruta le
            respondería 404. Aquí la pide el navegador, que sí la lleva.
          */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/compartido/${archivo}`}
            alt="Comprobante compartido"
            className="mx-auto max-h-64 rounded-md border bg-white object-contain"
          />
        )}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Busca por nombre o número de pedido"
          className="pl-9"
          aria-label="Buscar el pedido"
        />
      </div>

      {visibles.length === 0 && (
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Ningún pedido con eso.
        </p>
      )}

      <ul className="space-y-2">
        {visibles.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => elegir(p)}
              disabled={enganchando}
              className="w-full rounded-xl border bg-card p-3 text-left transition-colors hover:bg-accent disabled:opacity-60"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.cliente}</p>
                  <p className="font-mono text-2xs text-muted-foreground">
                    {p.orderNumber}
                  </p>
                </div>
                <span className="shrink-0 font-semibold tabular-nums">
                  {formatCurrency(p.total)}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span
                  className={`rounded-md px-2 py-0.5 text-2xs font-medium ${colorDeEstado(p.status)}`}
                >
                  {etiquetaDeEstado(p.status)}
                </span>
                <EtiquetaDePago
                  estado={p.status}
                  total={p.total}
                  comprobantes={p.comprobantes}
                />
                <span className="ml-auto text-2xs text-muted-foreground">
                  {formatDateTime(p.createdAt)}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
