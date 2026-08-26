"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { materialCategoryMeta, MATERIAL_CATEGORY_ORDER } from "@/lib/inventario";
import {
  Check,
  Plus,
  Trash2,
  Search,
  X,
  ShoppingCart,
  RotateCcw,
  ShoppingBag,
  Link2,
} from "lucide-react";
import {
  addShoppingItemsAction,
  addFreeTextItemAction,
  updateShoppingItemAction,
  deleteShoppingItemAction,
  finishShoppingListAction,
  reopenShoppingListAction,
  deleteShoppingListAction,
} from "../../actions";

type Item = {
  id: string;
  materialId: string | null;
  materialName: string | null;
  materialSlug: string | null;
  category: string | null;
  freeText: string | null;
  quantity: string | null;
  note: string | null;
  checked: boolean;
};

type MaterialOption = {
  id: string;
  name: string;
  category: string;
  pending: boolean;
};

/**
 * Lista de compra.
 *
 * Pensada para usarse con una mano en el pasillo de la tienda: los
 * artículos se marcan tocando toda la fila, y lo comprado se va al fondo
 * en vez de desaparecer, para poder desmarcarlo si hubo un error.
 */
export function ShoppingListView({
  list,
  items,
  materials,
}: {
  list: { id: string; name: string; notes: string | null; doneAt: string | null };
  items: Item[];
  materials: MaterialOption[];
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const closed = !!list.doneAt;
  const pendientes = items.filter((i) => !i.checked);
  const comprados = items.filter((i) => i.checked);

  function toggle(item: Item) {
    startTransition(async () => {
      await updateShoppingItemAction(item.id, { checked: !item.checked });
    });
  }

  function setQuantity(itemId: string, quantity: string) {
    startTransition(async () => {
      await updateShoppingItemAction(itemId, { quantity });
    });
  }

  function remove(itemId: string) {
    startTransition(async () => {
      await deleteShoppingItemAction(itemId);
    });
  }

  return (
    <>
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight leading-tight">
            {list.name}
          </h1>
          {list.notes && (
            <p className="text-sm text-muted-foreground mt-1">{list.notes}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1 tabular-nums">
            {comprados.length} de {items.length} comprados
          </p>
        </div>
        {!closed && (
          <Button onClick={() => setPickerOpen(true)} className="h-11 shrink-0">
            <Plus className="size-4" /> Agregar
          </Button>
        )}
      </div>

      {/* Progreso */}
      {items.length > 0 && (
        <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-5">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${(comprados.length / items.length) * 100}%` }}
          />
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed p-10 text-center">
          <ShoppingBag className="size-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            La lista está vacía.
          </p>
          {!closed && (
            <Button onClick={() => setPickerOpen(true)}>
              <Plus className="size-4" /> Agregar materias primas
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {pendientes.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onToggle={toggle}
              onQuantity={setQuantity}
              onDelete={remove}
              disabled={isPending || closed}
            />
          ))}

          {comprados.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground pt-3 pb-1">
                Comprados
              </p>
              {comprados.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onToggle={toggle}
                  onQuantity={setQuantity}
                  onDelete={remove}
                  disabled={isPending || closed}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Acciones de la lista */}
      <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t">
        {closed ? (
          <Button
            variant="outline"
            className="h-11"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await reopenShoppingListAction(list.id);
                toast.success("Lista reabierta");
              })
            }
          >
            <RotateCcw className="size-4" /> Reabrir
          </Button>
        ) : (
          <Button
            className="h-11 flex-1"
            disabled={isPending || items.length === 0}
            onClick={() =>
              startTransition(async () => {
                await finishShoppingListAction(list.id);
                toast.success("Lista completada");
              })
            }
          >
            <Check className="size-4" /> Marcar como completada
          </Button>
        )}
        <Button
          variant="outline"
          className="h-11 text-destructive"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await deleteShoppingListAction(list.id);
            })
          }
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <MaterialPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        materials={materials}
        alreadyIn={new Set(items.map((i) => i.materialId).filter(Boolean) as string[])}
        listId={list.id}
      />
    </>
  );
}

function ItemRow({
  item,
  onToggle,
  onQuantity,
  onDelete,
  disabled,
}: {
  item: Item;
  onToggle: (i: Item) => void;
  onQuantity: (id: string, q: string) => void;
  onDelete: (id: string) => void;
  disabled: boolean;
}) {
  const [qty, setQty] = useState(item.quantity ?? "");
  const meta = item.category ? materialCategoryMeta(item.category) : null;
  const name = item.materialName ?? item.freeText ?? "—";

  return (
    <div
      className={`rounded-xl border bg-card transition-colors ${
        item.checked ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Toda la zona del nombre marca el artículo */}
        <button
          type="button"
          onClick={() => onToggle(item)}
          disabled={disabled}
          aria-pressed={item.checked}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >
          <span
            className={`size-6 rounded-md border-2 shrink-0 flex items-center justify-center transition-colors ${
              item.checked
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground/30"
            }`}
          >
            {item.checked && <Check className="size-4" strokeWidth={3} />}
          </span>

          <span className="min-w-0 flex-1">
            <span
              className={`block font-medium leading-tight ${
                item.checked ? "line-through" : ""
              }`}
            >
              {name}
            </span>
            {meta && (
              <span className="block text-2xs text-muted-foreground">
                {meta.label}
              </span>
            )}
          </span>
        </button>

        {/* Cantidad libre: en la tienda se pide "medio kilo", no 500.00 g */}
        <Input
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          onBlur={() => {
            if (qty !== (item.quantity ?? "")) onQuantity(item.id, qty);
          }}
          disabled={disabled}
          placeholder="cant."
          className="h-9 w-24 text-sm shrink-0"
        />

        <button
          type="button"
          onClick={() => onDelete(item.id)}
          disabled={disabled}
          aria-label="Quitar"
          className="size-8 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground flex items-center justify-center shrink-0"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {item.materialSlug && (
        <div className="px-3 pb-2 -mt-1">
          <Link
            href={`/sistema/inventario/${item.materialSlug}`}
            className="inline-flex items-center gap-1 text-2xs text-primary hover:underline"
          >
            <Link2 className="size-3" /> Ver ficha
          </Link>
        </div>
      )}
    </div>
  );
}

function MaterialPicker({
  open,
  onClose,
  materials,
  alreadyIn,
  listId,
}: {
  open: boolean;
  onClose: () => void;
  materials: MaterialOption[];
  alreadyIn: Set<string>;
  listId: string;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [freeText, setFreeText] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const avail = materials.filter((m) => !alreadyIn.has(m.id));
    if (!q) return avail;
    return avail.filter((m) => m.name.toLowerCase().includes(q));
  }, [materials, alreadyIn, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, MaterialOption[]>();
    for (const m of filtered) {
      const arr = map.get(m.category) ?? [];
      arr.push(m);
      map.set(m.category, arr);
    }
    return MATERIAL_CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      key: c,
      materials: map.get(c)!,
    }));
  }, [filtered]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function confirm() {
    startTransition(async () => {
      if (selected.size > 0) {
        await addShoppingItemsAction(listId, [...selected]);
      }
      if (freeText.trim()) {
        await addFreeTextItemAction(listId, freeText);
      }
      toast.success("Agregado a la lista");
      setSelected(new Set());
      setFreeText("");
      setQuery("");
      onClose();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[85dvh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Agregar a la lista</DialogTitle>
        </DialogHeader>

        <div className="relative shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar…"
            className="h-11 pl-9 pr-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 size-8 rounded-full hover:bg-accent flex items-center justify-center"
              aria-label="Limpiar"
            >
              <X className="size-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto -mx-1 px-1 min-h-0">
          {grouped.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No queda nada por agregar.
            </p>
          ) : (
            <div className="space-y-4 py-1">
              {grouped.map(({ key, materials: list }) => {
                const meta = materialCategoryMeta(key);
                return (
                  <div key={key}>
                    <p className="text-2xs font-semibold text-muted-foreground mb-1.5">
                      {meta.label}
                    </p>
                    <div className="space-y-1">
                      {list.map((m) => {
                        const on = selected.has(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => toggle(m.id)}
                            className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-colors ${
                              on
                                ? "border-primary bg-primary/5"
                                : "hover:bg-accent"
                            }`}
                          >
                            <span
                              className={`size-5 rounded border-2 shrink-0 flex items-center justify-center ${
                                on
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "border-muted-foreground/30"
                              }`}
                            >
                              {on && <Check className="size-3.5" strokeWidth={3} />}
                            </span>
                            <span className="text-sm flex-1 min-w-0 truncate">
                              {m.name}
                            </span>
                            {m.pending && (
                              <span className="text-3xs text-sky-600 dark:text-sky-400 shrink-0">
                                por comprar
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 space-y-2 pt-2 border-t">
          <Input
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="O escribe algo que no esté en el inventario…"
            className="h-11"
          />
        </div>

        <DialogFooter className="gap-2 shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={confirm}
            disabled={isPending || (selected.size === 0 && !freeText.trim())}
          >
            <ShoppingCart className="size-4" />
            {selected.size > 0 ? `Agregar ${selected.size}` : "Agregar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
