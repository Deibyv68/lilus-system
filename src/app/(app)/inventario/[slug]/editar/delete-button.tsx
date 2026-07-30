"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, AlertTriangle } from "lucide-react";
import { deleteMaterialAction } from "../../actions";

export function DeleteMaterialButton({
  id,
  name,
  lotCount,
}: {
  id: string;
  name: string;
  lotCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-11 text-destructive"
        onClick={() => setOpen(true)}
        aria-label="Eliminar"
      >
        <Trash2 className="size-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar {name}</DialogTitle>
            <DialogDescription>
              Esto no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {lotCount > 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-3 flex gap-2">
              <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <p className="text-xs leading-snug">
                Se van a borrar también{" "}
                <strong>
                  {lotCount} {lotCount === 1 ? "lote" : "lotes"}
                </strong>{" "}
                con su historial de compras y precios.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await deleteMaterialAction(id);
                })
              }
            >
              {isPending ? "Eliminando…" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
