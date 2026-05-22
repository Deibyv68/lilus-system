"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPackAction, updatePackAction } from "./actions";
import { ImageIcon, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";

type ProductOption = {
  id: string;
  name: string;
  sku: string;
  price: number;
};

type PackItem = { productId: string; quantity: number };

type PackFormValues = {
  id?: string;
  sku?: string;
  name?: string;
  description?: string | null;
  price?: number;
  productionCost?: number;
  isActive?: boolean;
  imageUrl?: string | null;
  items?: PackItem[];
};

export function PackForm({
  initial,
  productOptions,
}: {
  initial?: PackFormValues;
  productOptions: ProductOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [active, setActive] = useState(initial?.isActive ?? true);
  const [imgPreview, setImgPreview] = useState<string | null>(initial?.imageUrl ?? null);
  const [items, setItems] = useState<PackItem[]>(initial?.items ?? []);

  const isEdit = !!initial?.id;

  const sumComponents = items.reduce((acc, it) => {
    const p = productOptions.find((p) => p.id === it.productId);
    return acc + (p?.price ?? 0) * it.quantity;
  }, 0);

  function addItem() {
    setItems((prev) => [...prev, { productId: "", quantity: 1 }]);
  }
  function updateItem(idx: number, patch: Partial<PackItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit(formData: FormData) {
    formData.set("isActive", active ? "on" : "");
    formData.set("items", JSON.stringify(items.filter((i) => i.productId)));

    startTransition(async () => {
      const action = isEdit
        ? updatePackAction.bind(null, initial!.id!)
        : createPackAction;
      const res = await action(formData);
      if (res && !res.ok) {
        toast.error(res.error ?? "Error al guardar");
        return;
      }
      toast.success(isEdit ? "Pack actualizado" : "Pack creado");
      if (isEdit) router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información del pack</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nombre" required>
                <Input
                  name="name"
                  required
                  defaultValue={initial?.name ?? ""}
                  placeholder="Pack relax"
                />
              </Field>
              <Field label="SKU" required>
                <Input
                  name="sku"
                  required
                  defaultValue={initial?.sku ?? ""}
                  placeholder="LIL-PACK-001"
                />
              </Field>
            </div>
            <Field label="Descripción">
              <Textarea
                name="description"
                rows={2}
                defaultValue={initial?.description ?? ""}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Precio venta (USD)" required>
                <Input
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  defaultValue={initial?.price ?? ""}
                />
              </Field>
              <Field label="Costo producción (USD)">
                <Input
                  name="productionCost"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={initial?.productionCost ?? 0}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Productos incluidos
              <Button type="button" size="sm" variant="outline" onClick={addItem}>
                <Plus className="size-4" /> Agregar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Agrega los productos que vienen dentro del pack.
              </p>
            )}
            {items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[1fr_90px_40px] gap-2 items-end"
              >
                <Field label={`Producto ${idx + 1}`}>
                  <Select
                    value={item.productId}
                    onValueChange={(v) => updateItem(idx, { productId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona…" />
                    </SelectTrigger>
                    <SelectContent>
                      {productOptions.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}{" "}
                          <span className="text-muted-foreground ml-2 text-xs">
                            {p.sku}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Cantidad">
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(idx, {
                        quantity: Math.max(1, parseInt(e.target.value || "1")),
                      })
                    }
                  />
                </Field>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(idx)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}

            {items.length > 0 && (
              <div className="text-xs text-muted-foreground border-t pt-3 mt-3">
                Suma de precios individuales:{" "}
                <strong className="text-foreground">
                  {formatCurrency(sumComponents)}
                </strong>
                {initial?.price && sumComponents > 0 && (
                  <span className="ml-2">
                    · Descuento implícito:{" "}
                    <strong className="text-foreground">
                      {formatCurrency(Math.max(0, sumComponents - (initial?.price ?? 0)))}
                    </strong>
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Activo</Label>
              <Switch
                id="isActive"
                checked={active}
                onCheckedChange={setActive}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Imagen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {imgPreview ? (
              <div className="relative aspect-square w-full rounded overflow-hidden bg-muted">
                <Image
                  src={imgPreview}
                  alt="preview"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="aspect-square w-full rounded bg-muted flex items-center justify-center text-muted-foreground">
                <ImageIcon className="size-10" />
              </div>
            )}
            <Input
              name="image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setImgPreview(URL.createObjectURL(f));
              }}
            />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear pack"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
