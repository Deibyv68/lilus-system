"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { lotStatusMeta } from "@/lib/inventario";
import {
  Plus,
  PackageOpen,
  Trash2,
  CalendarDays,
  AlertTriangle,
} from "lucide-react";
import {
  createLotAction,
  updateLotStatusAction,
  deleteLotAction,
} from "../actions";

type Lot = {
  id: string;
  supplier: string | null;
  purchasedAt: string | null;
  openedAt: string | null;
  expiresAt: string | null;
  lotCode: string | null;
  quantity: number | null;
  unit: string | null;
  price: number | null;
  container: string | null;
  status: string;
  notes: string | null;
};

const DIAS_AVISO = 60;

function fmt(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Lotes de una materia prima.
 *
 * Es la parte del inventario que responde "¿desde cuándo tenemos este
 * frasco?", que fue justo lo que no se pudo contestar cuando apareció el
 * olor a huevo en las cremas.
 */
export function LotsPanel({
  materialId,
  lots,
}: {
  materialId: string;
  lots: Lot[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const limite = new Date();
  limite.setDate(limite.getDate() + DIAS_AVISO);

  const activos = lots.filter(
    (l) => l.status !== "agotado" && l.status !== "descartado"
  );
  const historicos = lots.filter(
    (l) => l.status === "agotado" || l.status === "descartado"
  );

  function onCreate(fd: FormData) {
    startTransition(async () => {
      const res = await createLotAction(materialId, fd);
      if (res?.ok) {
        toast.success("Lote registrado");
        setOpen(false);
      }
    });
  }

  function changeStatus(lotId: string, status: string) {
    startTransition(async () => {
      await updateLotStatusAction(lotId, status);
      toast.success("Estado actualizado");
    });
  }

  function remove(lotId: string) {
    startTransition(async () => {
      await deleteLotAction(lotId);
      toast.success("Lote eliminado");
    });
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold">
          Lotes{" "}
          {lots.length > 0 && (
            <span className="text-muted-foreground font-normal">
              ({lots.length})
            </span>
          )}
        </h2>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Registrar compra
        </Button>
      </div>

      {lots.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-6 text-center">
          <PackageOpen className="size-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Sin lotes registrados.
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-snug">
            Registrar cada compra es lo que después permite saber desde cuándo
            tienes un frasco abierto.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {activos.map((l) => (
            <LotCard
              key={l.id}
              lot={l}
              expiringSoon={
                l.expiresAt != null && new Date(l.expiresAt) <= limite
              }
              onStatus={changeStatus}
              onDelete={remove}
              disabled={isPending}
            />
          ))}

          {historicos.length > 0 && (
            <details className="group">
              <summary className="text-xs text-muted-foreground cursor-pointer py-2 select-none">
                {historicos.length}{" "}
                {historicos.length === 1 ? "lote pasado" : "lotes pasados"}
              </summary>
              <div className="space-y-2 mt-2">
                {historicos.map((l) => (
                  <LotCard
                    key={l.id}
                    lot={l}
                    expiringSoon={false}
                    onStatus={changeStatus}
                    onDelete={remove}
                    disabled={isPending}
                  />
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Alta de lote */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar compra</DialogTitle>
          </DialogHeader>

          <form action={onCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Proveedor">
                <Input name="supplier" placeholder="Flora Síntesis" />
              </Field>
              <Field label="Lote del fabricante">
                <Input name="lotCode" placeholder="opcional" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha de compra">
                <Input name="purchasedAt" type="date" />
              </Field>
              <Field label="Fecha de apertura">
                <Input name="openedAt" type="date" />
              </Field>
            </div>

            <Field label="Caducidad" hint="La que trae el envase del fabricante">
              <Input name="expiresAt" type="date" />
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Cantidad">
                <Input name="quantity" inputMode="decimal" placeholder="500" />
              </Field>
              <Field label="Unidad">
                <Input name="unit" placeholder="g" defaultValue="g" />
              </Field>
              <Field label="Precio">
                <Input name="price" inputMode="decimal" placeholder="12.50" />
              </Field>
            </div>

            <Field
              label="Envase"
              hint="En qué llegó o en cuál se guardó. Este dato importa más de lo que parece."
            >
              <Input name="container" placeholder="Vidrio ámbar" />
            </Field>

            <Field label="Estado">
              <Select name="status" defaultValue="sin-abrir">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sin-abrir">Sin abrir</SelectItem>
                  <SelectItem value="abierto">Abierto</SelectItem>
                  <SelectItem value="agotado">Agotado</SelectItem>
                  <SelectItem value="descartado">Descartado</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Observaciones">
              <Textarea
                name="notes"
                rows={2}
                placeholder="Llegó en plástico transparente en vez de ámbar…"
              />
            </Field>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Guardando…" : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function LotCard({
  lot: l,
  expiringSoon,
  onStatus,
  onDelete,
  disabled,
}: {
  lot: Lot;
  expiringSoon: boolean;
  onStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  disabled: boolean;
}) {
  const status = lotStatusMeta(l.status);
  const faded = l.status === "agotado" || l.status === "descartado";

  return (
    <div className={`rounded-xl border bg-card p-3 ${faded ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${status.chip}`}
            >
              {status.label}
            </span>
            {l.quantity != null && (
              <span className="text-sm font-semibold tabular-nums">
                {l.quantity} {l.unit ?? ""}
              </span>
            )}
            {l.price != null && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatCurrency(l.price)}
              </span>
            )}
          </div>

          <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
            {l.supplier && <p>{l.supplier}</p>}
            {l.lotCode && <p className="font-mono">Lote {l.lotCode}</p>}
            {l.container && <p>{l.container}</p>}
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[11px] text-muted-foreground">
            {l.purchasedAt && <span>Comprado {fmt(l.purchasedAt)}</span>}
            {l.openedAt && (
              <span className="font-medium text-foreground">
                Abierto {fmt(l.openedAt)}
              </span>
            )}
            {l.expiresAt && (
              <span
                className={
                  expiringSoon ? "text-amber-600 dark:text-amber-400 font-medium" : ""
                }
              >
                Vence {fmt(l.expiresAt)}
              </span>
            )}
          </div>

          {expiringSoon && (
            <p className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 mt-1">
              <AlertTriangle className="size-3" /> Caduca pronto
            </p>
          )}

          {l.notes && (
            <p className="text-[11px] mt-1.5 leading-snug">{l.notes}</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDelete(l.id)}
          disabled={disabled}
          aria-label="Eliminar lote"
          className="size-8 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground flex items-center justify-center shrink-0"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {/* Cambio rápido de estado */}
      {!faded && (
        <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t">
          {l.status === "sin-abrir" && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => onStatus(l.id, "abierto")}
              disabled={disabled}
            >
              <CalendarDays className="size-3.5" /> Marcar como abierto hoy
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => onStatus(l.id, "agotado")}
            disabled={disabled}
          >
            Se agotó
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => onStatus(l.id, "descartado")}
            disabled={disabled}
          >
            Descartar
          </Button>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
