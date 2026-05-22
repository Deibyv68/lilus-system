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
import { createProductAction, updateProductAction } from "./actions";
import { FileText, ImageIcon } from "lucide-react";

type ProductFormValues = {
  id?: string;
  sku?: string;
  name?: string;
  shortName?: string | null;
  description?: string | null;
  price?: number;
  productionCost?: number;
  weightGrams?: number | null;
  ingredients?: string | null;
  shelfLifeMonths?: number | null;
  stock?: number;
  isActive?: boolean;
  imageUrl?: string | null;
  labelPdfUrl?: string | null;
};

export function ProductForm({ initial }: { initial?: ProductFormValues }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [active, setActive] = useState(initial?.isActive ?? true);
  const [imgPreview, setImgPreview] = useState<string | null>(initial?.imageUrl ?? null);
  const [labelName, setLabelName] = useState<string | null>(
    initial?.labelPdfUrl ? initial.labelPdfUrl.split("/").pop() ?? null : null
  );

  const isEdit = !!initial?.id;

  async function onSubmit(formData: FormData) {
    formData.set("isActive", active ? "on" : "");

    startTransition(async () => {
      const action = isEdit
        ? updateProductAction.bind(null, initial!.id!)
        : createProductAction;
      const res = await action(formData);
      if (res && !res.ok) {
        toast.error(res.error ?? "Error al guardar");
        return;
      }
      toast.success(isEdit ? "Producto actualizado" : "Producto creado");
      if (isEdit) router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información general</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nombre" required>
                <Input
                  name="name"
                  required
                  maxLength={120}
                  defaultValue={initial?.name ?? ""}
                />
              </Field>
              <Field label="SKU" required>
                <Input
                  name="sku"
                  required
                  maxLength={40}
                  defaultValue={initial?.sku ?? ""}
                  placeholder="LIL-JAB-001"
                />
              </Field>
            </div>
            <Field
              label="Nombre corto (para etiqueta 2x1)"
              hint="Si lo dejas vacío se usa el nombre completo."
            >
              <Input
                name="shortName"
                maxLength={40}
                defaultValue={initial?.shortName ?? ""}
                placeholder="ej. Jabón Lavanda"
              />
            </Field>
            <Field label="Descripción">
              <Textarea
                name="description"
                rows={3}
                defaultValue={initial?.description ?? ""}
              />
            </Field>
            <Field label="Ingredientes" hint="Se imprime en la etiqueta 2x1.">
              <Textarea
                name="ingredients"
                rows={3}
                defaultValue={initial?.ingredients ?? ""}
                placeholder="Aceite de coco, manteca de karité, lavanda…"
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Precio y costos</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <Field label="Stock inicial">
              <Input
                name="stock"
                type="number"
                min="0"
                step="1"
                defaultValue={initial?.stock ?? 0}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Producción y caducidad</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Vida útil (meses)"
              hint="Se usa para calcular la fecha de caducidad de cada unidad."
            >
              <Input
                name="shelfLifeMonths"
                type="number"
                min="1"
                step="1"
                defaultValue={initial?.shelfLifeMonths ?? 12}
              />
            </Field>
            <Field label="Peso (gramos)">
              <Input
                name="weightGrams"
                type="number"
                min="0"
                step="0.1"
                defaultValue={initial?.weightGrams ?? ""}
              />
            </Field>
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
              <Label htmlFor="isActive">Activo en catálogo</Label>
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

        <Card>
          <CardHeader>
            <CardTitle>Etiqueta del producto (PDF)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Sube el PDF de la etiqueta que ya tienes diseñada. Se imprimirá
              junto con el pedido.
            </p>
            {labelName && (
              <div className="text-xs flex items-center gap-2 p-2 rounded bg-muted">
                <FileText className="size-4 shrink-0" />
                <span className="truncate">{labelName}</span>
              </div>
            )}
            <Input
              name="labelPdf"
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setLabelName(f.name);
              }}
            />
            {initial?.labelPdfUrl && (
              <a
                href={initial.labelPdfUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary underline"
              >
                Ver PDF actual
              </a>
            )}
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear producto"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
