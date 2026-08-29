"use client";

import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { colorDeEstado, etiquetaDeEstado } from "@/lib/estados-pedido";
import { EtiquetaDePago } from "@/components/etiqueta-de-pago";
import type { ComprobanteParaContar } from "@/lib/pago-del-pedido";

export type PedidoParaElegir = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  cliente: string;
  comprobantes: ComprobanteParaContar[];
};

/**
 * «¿De qué pedido es esto?» — la lista para elegir uno.
 *
 * ── Por qué es compartida ──
 *
 * La usan dos entradas que hacen lo mismo con cosas distintas: el
 * comprobante que llega compartido desde WhatsApp, y la ubicación que
 * llega al abrirla «con» LILUS. En las dos, quien llega viene de otra app
 * y lo único que falta es decir a qué pedido pertenece.
 *
 * Escribirla dos veces habría significado dos búsquedas que se comportan
 * distinto, y dos sitios donde arreglar el mismo detalle.
 *
 * ── El buscador ──
 *
 * Treinta pedidos no caben en una pantalla de teléfono. Quien acaba de
 * hablar con la clienta tiene su nombre fresco, así que escribirlo es más
 * rápido que desplazarse buscando el número.
 */
export function ElegirPedido({
  pedidos,
  onElegir,
  encabezado,
}: {
  pedidos: PedidoParaElegir[];
  /** Devuelve un error si no se pudo. Si va bien, suele redirigir. */
  onElegir: (id: string) => Promise<{ ok: boolean; error?: string } | void>;
  /** Lo que se está a punto de enganchar, para poder verlo antes. */
  encabezado?: React.ReactNode;
}) {
  const [texto, setTexto] = useState("");
  const [trabajando, empezar] = useTransition();

  const busca = texto.trim().toLowerCase();
  const visibles = busca
    ? pedidos.filter(
        (p) =>
          p.cliente.toLowerCase().includes(busca) ||
          p.orderNumber.toLowerCase().includes(busca)
      )
    : pedidos;

  return (
    <div className="space-y-4">
      {encabezado}

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
              onClick={() =>
                empezar(async () => {
                  const r = await onElegir(p.id);
                  // Si todo va bien la acción redirige y esto no se ve.
                  if (r && !r.ok) toast.error(r.error ?? "No se pudo");
                })
              }
              disabled={trabajando}
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
