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
  Globe,
} from "lucide-react";
import { deleteOrdersAction } from "./actions";
import { ChipDeEspera, HaceCuanto } from "./espera";
import { Filtros } from "./filtros";
import {
  contarPorAtajo,
  pasaElAtajo,
  pasaElAvanzado,
  origenesDe,
  transportadorasDe,
  criteriosPuestos,
  ETIQUETA_ATAJO,
  AVANZADO_VACIO,
  type Atajo,
  type Avanzado,
} from "@/lib/filtrar-pedidos";
import { colorDeEstado, etiquetaDeEstado } from "@/lib/estados-pedido";
import { EtiquetaDePago } from "@/components/etiqueta-de-pago";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string | Date;
  source: string | null;
  customer: {
    name: string;
    phone?: string | null;
    contactPhone?: string | null;
    cedula?: string | null;
  };
  ciudad?: string | null;
  carrier: { name: string } | null;
  _count: { items: number };
  comprobantes: { aceptado: boolean | null; montoConfirmado: number | null }[];
};

export function OrderList({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [atajo, setAtajo] = useState<Atajo>("todos");
  const [avanzado, setAvanzado] = useState<Avanzado>(AVANZADO_VACIO);
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
    /*
      Solo los visibles. «Seleccionar todos» con un filtro puesto tiene
      que significar todos LOS DE ESTE FILTRO — si no, se imprimirían
      etiquetas de pedidos que ni siquiera están en pantalla.
    */
    setSelectedIds(new Set(visibles.map((o) => o.id)));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  /*
    Los filtros se cuentan sobre TODOS los pedidos, no sobre los visibles.

    Si el número de al lado de «Pendientes» cambiara según lo que ya está
    filtrado, dejaría de servir para lo que sirve: decidir adónde ir. Se
    mira para saber cuánto trabajo hay ahí, no cuánto queda de lo que ya
    se está mirando.
  */
  const cuentas = contarPorAtajo(orders);

  /*
    El atajo y el avanzado se cruzan con Y.

    Marcar «Por cobrar» arriba y luego acotar a Instagram abajo tiene que
    dar los pendientes DE Instagram. Que el segundo anulara al primero
    sería una sorpresa cada vez, y de las que no se notan: sale una lista
    plausible con lo que no se pidió.
  */
  const visibles = orders.filter(
    (o) => pasaElAtajo(o, atajo) && pasaElAvanzado(o, avanzado)
  );

  const origenes = origenesDe(orders);
  const transportadoras = transportadorasDe(orders);
  const hayAvanzado = criteriosPuestos(avanzado) > 0;

  function goBatchPrint() {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds).join(",");
    router.push(`/sistema/pedidos/lote/imprimir?ids=${ids}`);
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
              className="text-2xs underline opacity-90"
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

      <Filtros
        atajo={atajo}
        onAtajo={setAtajo}
        cuentas={cuentas}
        avanzado={avanzado}
        onAvanzado={setAvanzado}
        origenes={origenes}
        transportadoras={transportadoras}
        visibles={visibles.length}
        total={orders.length}
      />

      {visibles.length === 0 && (
        <div className="rounded-2xl border border-dashed px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            {hayAvanzado
              ? "Ningún pedido cumple lo que buscas."
              : `No hay pedidos en «${ETIQUETA_ATAJO[atajo]}».`}
          </p>
          {/*
            La salida, ahí mismo. Una lista vacía sin forma de volver deja
            a quien filtró de más buscando qué desmarcar entre ocho
            criterios que ya no ve.
          */}
          {(hayAvanzado || atajo !== "todos") && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setAtajo("todos");
                setAvanzado(AVANZADO_VACIO);
              }}
            >
              Ver todos los pedidos
            </Button>
          )}
        </div>
      )}

      <ul className="space-y-3">
        {visibles.map((o) => {
          const checked = selectedIds.has(o.id);

          // Modo normal: card link al detalle
          if (!selectionMode) {
            return (
              <li key={o.id}>
                <Link
                  href={`/sistema/pedidos/${o.id}`}
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
          <p className="text-3xs text-muted-foreground mt-0.5">
            {o._count.items} {o._count.items === 1 ? "ítem" : "ítems"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-2xs px-2 py-0.5 rounded-md font-medium ${colorDeEstado(
              o.status
            )}`}
          >
            {etiquetaDeEstado(o.status)}
          </span>
          {/*
            El pedido web se marca distinto y no como una etiqueta gris mas.
            Es el unico que nadie tomo a mano: llego solo, y alguien tiene
            que ir a mirar si la transferencia entro.
          */}
          {o.source === "Web" && (
            <Badge className="text-3xs bg-emerald-600 hover:bg-emerald-600">
              <Globe className="size-2.5" /> Web
            </Badge>
          )}
          {o.source && o.source !== "Web" && (
            <Badge variant="secondary" className="text-3xs">
              {o.source}
            </Badge>
          )}
          <EtiquetaDePago
            estado={o.status}
            total={o.total}
            comprobantes={o.comprobantes}
          />
          <ChipDeEspera estado={o.status} creadoEn={o.createdAt} />
          {o.carrier && (
            <Badge variant="outline" className="text-3xs">
              {o.carrier.name}
            </Badge>
          )}
        </div>
        {/*
          El tiempo transcurrido va delante de la fecha, y en el movil se
          queda solo. «hace 3 h» dice lo que hay que hacer con el pedido;
          «26 ago» hay que restarlo mentalmente para saber lo mismo.
        */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          <span className="tabular-nums">
            <HaceCuanto fecha={o.createdAt} />
          </span>
          <span className="hidden text-muted-foreground/60 sm:inline">
            · {formatDateTime(o.createdAt)}
          </span>
          <ChevronRight className="size-4" />
        </div>
      </div>

    </>
  );
}
