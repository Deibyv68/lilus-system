"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { ChevronRight, Printer, X } from "lucide-react";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string | Date;
  customer: { name: string };
  carrier: { name: string } | null;
  _count: { items: number };
};

const statusLabel: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  PACKED: "Empaquetado",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

const statusColor: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  PAID: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  PACKED: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
  SHIPPED: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200",
  DELIVERED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

export function OrderList({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectionMode = selectedIds.size > 0;

  function toggleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function selectAll() {
    setSelectedIds(new Set(orders.map((o) => o.id)));
  }

  function goBatchPrint() {
    const ids = Array.from(selectedIds).join(",");
    router.push(`/pedidos/lote/imprimir?ids=${ids}`);
  }

  return (
    <>
      {/* Barra de selección — visible cuando hay items marcados */}
      {selectionMode && (
        <div className="sticky top-0 z-20 -mx-4 sm:mx-0 mb-3 px-4 sm:px-4 py-3 bg-primary text-primary-foreground rounded-none sm:rounded-xl shadow-lg flex items-center gap-3">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 text-primary-foreground hover:bg-white/15"
            onClick={clearSelection}
          >
            <X className="size-4" />
          </Button>
          <div className="flex-1">
            <p className="font-semibold leading-tight">
              {selectedIds.size} pedido{selectedIds.size === 1 ? "" : "s"} seleccionado
              {selectedIds.size === 1 ? "" : "s"}
            </p>
            <button
              type="button"
              onClick={selectedIds.size === orders.length ? clearSelection : selectAll}
              className="text-[11px] underline opacity-90"
            >
              {selectedIds.size === orders.length
                ? "Deseleccionar todos"
                : "Seleccionar todos"}
            </button>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="h-10"
            onClick={goBatchPrint}
          >
            <Printer className="size-4" />
            Imprimir lote
          </Button>
        </div>
      )}

      {/* Texto de ayuda cuando no hay selección */}
      {!selectionMode && (
        <p className="text-[11px] text-muted-foreground mb-3">
          Mantén presionado o usa los checkboxes para seleccionar varios pedidos
          e imprimirlos juntos.
        </p>
      )}

      <ul className="space-y-3">
        {orders.map((o) => {
          const checked = selectedIds.has(o.id);
          return (
            <li key={o.id}>
              <div
                className={`relative rounded-2xl border bg-card transition-colors ${
                  checked
                    ? "border-primary/60 ring-2 ring-primary/20"
                    : "hover:bg-accent"
                }`}
              >
                {/* Checkbox — visible siempre */}
                <div
                  className="absolute top-3 left-3 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(c) => toggleSelect(o.id, c === true)}
                    className="size-5"
                  />
                </div>

                {/* Card contenido — clickable para ir al detalle */}
                <Link
                  href={`/pedidos/${o.id}`}
                  className="block p-4 pl-12 active:scale-[0.99] transition-transform"
                  onClick={(e) => {
                    // Si hay selección activa, en lugar de navegar, toggle la selección
                    if (selectionMode) {
                      e.preventDefault();
                      toggleSelect(o.id, !checked);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-base truncate leading-tight">
                        {o.customer.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {o.orderNumber}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold tabular-nums leading-tight">
                        {formatCurrency(o.total)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {o._count.items} {o._count.items === 1 ? "ítem" : "ítems"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                          statusColor[o.status] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {statusLabel[o.status] ?? o.status}
                      </span>
                      {o.carrier && (
                        <Badge variant="outline" className="text-[10px]">
                          {o.carrier.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                      <span className="hidden sm:inline">
                        {formatDateTime(o.createdAt)}
                      </span>
                      <span className="sm:hidden">
                        {new Intl.DateTimeFormat("es-EC", {
                          day: "2-digit",
                          month: "short",
                        }).format(new Date(o.createdAt))}
                      </span>
                      <ChevronRight className="size-4" />
                    </div>
                  </div>
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
