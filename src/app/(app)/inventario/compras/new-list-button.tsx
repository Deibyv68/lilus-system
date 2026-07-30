"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import { createShoppingListAction } from "../actions";

export function NewListButton() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hoy = new Date().toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "long",
  });

  return (
    <>
      <Button size="lg" className="h-11" onClick={() => setOpen(true)}>
        <PlusCircle className="size-4" /> Nueva lista
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nueva lista de compra</DialogTitle>
          </DialogHeader>

          <form
            action={(fd) => startTransition(async () => {
              await createShoppingListAction(fd);
            })}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nombre</Label>
              <Input
                name="name"
                defaultValue={`Compra ${hoy}`}
                className="h-11"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nota</Label>
              <Textarea
                name="notes"
                rows={2}
                placeholder="Para el pedido de Flora Síntesis…"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creando…" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
