"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { MATERIAL_CATEGORY_ORDER, MATERIAL_CATEGORIES } from "@/lib/inventario";
import { createMaterialAction, updateMaterialAction } from "./actions";

export type MaterialFormValues = {
  id?: string;
  name?: string;
  category?: string;
  inciName?: string | null;
  tradeName?: string | null;
  manufacturer?: string | null;
  purpose?: string | null;
  usageMin?: number | null;
  usageMax?: number | null;
  phMin?: number | null;
  phMax?: number | null;
  maxTemp?: number | null;
  solubility?: string | null;
  leaveOn?: boolean | null;
  spectrum?: string | null;
  incompatible?: string | null;
  datasheetUrl?: string | null;
  container?: string | null;
  storage?: string | null;
  lightSensitive?: boolean;
  oxygenSensitive?: boolean;
  moistureSensitive?: boolean;
  openedShelfLife?: string | null;
  notes?: string | null;
};

export function MaterialForm({ initial }: { initial?: MaterialFormValues }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = !!initial?.id;

  const [light, setLight] = useState(initial?.lightSensitive ?? false);
  const [oxygen, setOxygen] = useState(initial?.oxygenSensitive ?? false);
  const [moisture, setMoisture] = useState(initial?.moistureSensitive ?? false);

  async function onSubmit(fd: FormData) {
    fd.set("lightSensitive", light ? "on" : "");
    fd.set("oxygenSensitive", oxygen ? "on" : "");
    fd.set("moistureSensitive", moisture ? "on" : "");

    startTransition(async () => {
      const action = isEdit
        ? updateMaterialAction.bind(null, initial!.id!)
        : createMaterialAction;
      const res = await action(fd);
      if (res && !res.ok) {
        toast.error(res.error ?? "Error al guardar");
        return;
      }
      toast.success(isEdit ? "Materia prima actualizada" : "Materia prima creada");
      if (isEdit) router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="space-y-5 max-w-3xl">
      {/* Identidad */}
      <Card>
        <CardHeader>
          <CardTitle>Identidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre" required>
              <Input
                name="name"
                required
                defaultValue={initial?.name ?? ""}
                placeholder="Colágeno hidrolizado"
                className="h-11"
              />
            </Field>
            <Field label="Categoría" required>
              <Select
                name="category"
                defaultValue={initial?.category ?? "auxiliar"}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_CATEGORY_ORDER.map((c) => (
                    <SelectItem key={c} value={c}>
                      {MATERIAL_CATEGORIES[c].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field
            label="Nombre INCI"
            hint="El nombre estandarizado, el que no depende de la marca. Es lo que aparece en las etiquetas."
          >
            <Input
              name="inciName"
              defaultValue={initial?.inciName ?? ""}
              placeholder="Hydrolyzed Collagen"
              className="h-11 font-mono text-sm"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre comercial">
              <Input
                name="tradeName"
                defaultValue={initial?.tradeName ?? ""}
                placeholder="Kemidant L"
                className="h-11"
              />
            </Field>
            <Field label="Fabricante">
              <Input
                name="manufacturer"
                defaultValue={initial?.manufacturer ?? ""}
                placeholder="Akema"
                className="h-11"
              />
            </Field>
          </div>

          <Field label="Para qué sirve">
            <Textarea
              name="purpose"
              rows={2}
              defaultValue={initial?.purpose ?? ""}
              placeholder="Emulsionante catiónico de las cremas."
            />
          </Field>
        </CardContent>
      </Card>

      {/* Ficha técnica */}
      <Card>
        <CardHeader>
          <CardTitle>Ficha técnica</CardTitle>
          <p className="text-xs text-muted-foreground">
            Estos datos vienen de la ficha del fabricante. Si no la tienes,
            pídesela al proveedor: es gratis y te la deben dar. Deja en blanco
            lo que no sepas — un dato inventado es peor que un campo vacío.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Uso mín. %">
              <Input
                name="usageMin"
                inputMode="decimal"
                defaultValue={initial?.usageMin ?? ""}
                className="h-11 tabular-nums"
              />
            </Field>
            <Field label="Uso máx. %">
              <Input
                name="usageMax"
                inputMode="decimal"
                defaultValue={initial?.usageMax ?? ""}
                className="h-11 tabular-nums"
              />
            </Field>
            <Field label="pH mín.">
              <Input
                name="phMin"
                inputMode="decimal"
                defaultValue={initial?.phMin ?? ""}
                className="h-11 tabular-nums"
              />
            </Field>
            <Field label="pH máx.">
              <Input
                name="phMax"
                inputMode="decimal"
                defaultValue={initial?.phMax ?? ""}
                className="h-11 tabular-nums"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Temp. máxima °C" hint="A la que se puede agregar">
              <Input
                name="maxTemp"
                inputMode="decimal"
                defaultValue={initial?.maxTemp ?? ""}
                className="h-11 tabular-nums"
              />
            </Field>
            <Field label="Soluble en">
              <Select name="solubility" defaultValue={initial?.solubility ?? "none"}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No indicado</SelectItem>
                  <SelectItem value="agua">Agua</SelectItem>
                  <SelectItem value="aceite">Aceite</SelectItem>
                  <SelectItem value="ambas">Ambas</SelectItem>
                  <SelectItem value="dispersable">Dispersable</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field
              label="Se queda en la piel"
              hint="Apto para producto que no se enjuaga"
            >
              <Select
                name="leaveOn"
                defaultValue={
                  initial?.leaveOn === true
                    ? "si"
                    : initial?.leaveOn === false
                      ? "no"
                      : "none"
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No indicado</SelectItem>
                  <SelectItem value="si">Sí</SelectItem>
                  <SelectItem value="no">Solo enjuague</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Protege contra" hint="Para conservantes: su espectro">
            <Input
              name="spectrum"
              defaultValue={initial?.spectrum ?? ""}
              placeholder="Bacterias Gram (−), Gram (+) y mohos"
              className="h-11"
            />
          </Field>

          <Field
            label="No se lleva con"
            hint="Incompatibilidades. Este campo puede salvarte una tanda."
          >
            <Textarea
              name="incompatible"
              rows={2}
              defaultValue={initial?.incompatible ?? ""}
              placeholder="Ingredientes aniónicos: al ser catiónico, la emulsión se corta."
            />
          </Field>

          <Field label="Enlace a la ficha técnica">
            <Input
              name="datasheetUrl"
              type="url"
              defaultValue={initial?.datasheetUrl ?? ""}
              placeholder="https://…"
              className="h-11"
            />
          </Field>
        </CardContent>
      </Card>

      {/* Conservación */}
      <Card>
        <CardHeader>
          <CardTitle>Conservación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Envase requerido">
              <Input
                name="container"
                defaultValue={initial?.container ?? ""}
                placeholder="Vidrio ámbar"
                className="h-11"
              />
            </Field>
            <Field label="Almacenamiento">
              <Select name="storage" defaultValue={initial?.storage ?? "none"}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No indicado</SelectItem>
                  <SelectItem value="ambiente">Ambiente</SelectItem>
                  <SelectItem value="refrigerado">Refrigerado</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Vida útil una vez abierto">
            <Input
              name="openedShelfLife"
              defaultValue={initial?.openedShelfLife ?? ""}
              placeholder="6 meses"
              className="h-11"
            />
          </Field>

          <div className="space-y-3 pt-1">
            <Toggle
              label="Sensible a la luz"
              hint="Necesita frasco ámbar u opaco"
              checked={light}
              onChange={setLight}
            />
            <Toggle
              label="Sensible al oxígeno"
              hint="Se degrada al abrir el frasco repetidas veces"
              checked={oxygen}
              onChange={setOxygen}
            />
            <Toggle
              label="Sensible a la humedad"
              hint="Necesita frasco hermético"
              checked={moisture}
              onChange={setMoisture}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notas */}
      <Card>
        <CardHeader>
          <CardTitle>Notas</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            name="notes"
            rows={4}
            defaultValue={initial?.notes ?? ""}
            placeholder="Lo que haya que recordar de este ingrediente…"
          />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
        <Button type="submit" className="h-12 flex-1" disabled={isPending}>
          {isPending
            ? "Guardando…"
            : isEdit
              ? "Guardar cambios"
              : "Crear materia prima"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && (
        <p className="text-3xs text-muted-foreground leading-snug">{hint}</p>
      )}
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight">{label}</p>
        <p className="text-2xs text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
