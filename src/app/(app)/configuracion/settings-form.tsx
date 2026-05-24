"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { saveSettingsAction } from "./actions";

type Initial = Record<string, string>;

export function SettingsForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof Initial>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <form
      action={(fd) => {
        for (const [k, v] of Object.entries(values)) fd.set(k, v);
        startTransition(async () => {
          try {
            await saveSettingsAction(fd);
            toast.success("Guardado");
            router.refresh();
          } catch {
            toast.error("Error al guardar");
          }
        });
      }}
      className="space-y-6"
    >
      {/* Marca */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Marca
        </h3>
        <Field
          label="Nombre de la marca"
          value={values.brand_name}
          onChange={(v) => update("brand_name", v)}
          hint="Aparece como título en el sistema y como cabecera de la etiqueta de envío."
        />
        <Field
          label="Prefijo de número de pedido"
          value={values.order_prefix}
          onChange={(v) => update("order_prefix", v)}
          hint="Ejemplo: LILUS-000001"
        />
      </div>

      {/* Remitente */}
      <div className="space-y-3 pt-2 border-t">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Datos del remitente
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Lo que la transportadora ve. Aparece en la sección{" "}
            <strong>REMITE</strong> de cada etiqueta de envío.
          </p>
        </div>

        <Field
          label="Nombre completo"
          value={values.sender_name}
          onChange={(v) => update("sender_name", v)}
          placeholder="Ej: María Pérez / LILUS Jabones Artesanales"
        />
        <Field
          label="Cédula / RUC"
          value={values.sender_cedula}
          onChange={(v) => update("sender_cedula", v)}
          placeholder="1700000000"
        />
        <Field
          label="Teléfono"
          value={values.sender_phone}
          onChange={(v) => update("sender_phone", v)}
          placeholder="0999999999"
        />
        <Field
          label="Email"
          value={values.sender_email}
          onChange={(v) => update("sender_email", v)}
          placeholder="contacto@lilus.com"
        />

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Ciudad"
            value={values.sender_city}
            onChange={(v) => update("sender_city", v)}
            placeholder="Quito"
          />
          <Field
            label="Provincia"
            value={values.sender_province}
            onChange={(v) => update("sender_province", v)}
            placeholder="Pichincha"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">
            Dirección (calle, sector)
          </Label>
          <Textarea
            value={values.sender_address}
            onChange={(e) => update("sender_address", e.target.value)}
            placeholder="Calle, número, sector, referencias…"
            rows={2}
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? "Guardando…" : "Guardar"}
      </Button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
