"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  ChevronRight,
  Printer,
  X,
  CheckCircle2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { deleteOrdersAction } from "./actions";

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
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, startDelete] = useTransition();

  function enterSelection() {
    setSelectionMode(true);
  }

  function exitSelection() {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(orders.map((o) => o.id)));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  function goBatchPrint() {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds).join(",");
    router.push(`/pedidos/lote/imprimir?ids=${ids}`);
  }

  function confirmDelete() {
    if (selectedIds.size === 0) return;
    startDelete(async () => {
      const ids = Array.from(selectedIds);
      const res = await deleteOrdersAction(ids);
      if (!res.ok) {
        toast.error(res.error ?? "Error eliminando pedidos");
        return;
      }
      toast.success(
        `${res.count} pedido${res.count === 1 ? "" : "s"} eliminado${res.count === 1 ? "" : "s"}`
      );
      setDeleteOpen(false);
      setSelectionMode(false);
      setSelectedIds(new Set());
      router.refresh();
    });
  }

  return (
    <>
      {/* Barra de control de selección */}
      {!selectionMode ? (
        <div className="mb-4 flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Toca un pedido para ver el detalle.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={enterSelection}
            className="h-9"
          >
            <CheckCircle2 className="size-4" />
            Seleccionar varios
          </Button>
        </div>
      ) : (
        <div className="sticky top-0 z-20 -mx-4 sm:mx-0 mb-3 px-4 sm:px-4 py-3 bg-primary text-primary-foreground rounded-none sm:rounded-xl shadow-lg flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-9 text-primary-foreground hover:bg-white/15 shrink-0"
            onClick={exitSelection}
            aria-label="Salir del modo selección"
          >
            <X className="size-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold leading-tight text-sm">
              {selectedIds.size === 0
                ? "Toca pedidos para seleccionarlos"
                : `${selectedIds.size} seleccionado${selectedIds.size === 1 ? "" : "s"}`}
            </p>
            <button
              type="button"
              onClick={
                selectedIds.size === orders.length ? deselectAll : selectAll
              }
              className="text-[11px] underline opacity-90"
            >
              {selectedIds.size === orders.length
                ? "Deseleccionar todos"
                : "Seleccionar todos"}
            </button>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="h-10 shrink-0 text-primary-foreground hover:bg-white/15"
            onClick={() => setDeleteOpen(true)}
            disabled={selectedIds.size === 0}
            title="Eliminar seleccionados"
          >
            <Trash2 className="size-4" />
            <span className="hidden sm:inline">Eliminar</span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-10 shrink-0"
            onClick={goBatchPrint}
            disabled={selectedIds.size === 0}
          >
            <Printer className="size-4" />
            Imprimir
          </Button>
        </div>
      )}

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Eliminar pedidos
            </DialogTitle>
            <DialogDescription>
              Vas a eliminar{" "}
              <strong className="text-foreground">{selectedIds.size}</strong>{" "}
              pedido{selectedIds.size === 1 ? "" : "s"}. Esta acción{" "}
              <strong>no se puede deshacer</strong> y borra también sus ítems,
              unidades de producción y trabajos de impresión.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              <Trash2 className="size-4" />
              {isDeleting ? "Eliminando…" : "Sí, eliminar todos"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ul className="space-y-3">
        {orders.map((o) => {
          const checked = selectedIds.has(o.id);

          // Modo normal: card link al detalle
          if (!selectionMode) {
            return (
              <li key={o.id}>
                <Link
                  href={`/pedidos/${o.id}`}
                  className="block rounded-2xl border bg-card p-4 hover:bg-accent active:scale-[0.99] transition-all"
                >
                  <OrderCardContent o={o} />
                </Link>
              </li>
            );
          }

          // Modo selección: card toggleable con checkbox
          return (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => toggleSelect(o.id)}
                className={`w-full text-left rounded-2xl border bg-card p-4 pl-12 relative transition-all ${
                  checked
                    ? "border-primary/60 ring-2 ring-primary/20"
                    : "hover:bg-accent"
                }`}
              >
                <div className="absolute top-1/2 -translate-y-1/2 left-3 pointer-events-none">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleSelect(o.id)}
                    className="size-5"
                  />
                </div>
                <OrderCardContent o={o} />
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function OrderCardContent({ o }: { o: Order }) {
  return (
    <>
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
    </>
  );
}
