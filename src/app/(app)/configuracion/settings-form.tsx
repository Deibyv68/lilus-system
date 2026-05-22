"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { saveSettingsAction } from "./actions";

export function SettingsForm({
  initial,
}: {
  initial: Record<string, string>;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [isPending, startTransition] = useTransition();

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
      className="space-y-4 max-w-lg"
    >
      <Field
        label="Marca"
        value={values.brand_name}
        onChange={(v) => setValues({ ...values, brand_name: v })}
      />
      <Field
        label="Nombre del remitente (etiqueta)"
        value={values.sender_name}
        onChange={(v) => setValues({ ...values, sender_name: v })}
      />
      <Field
        label="Teléfono"
        value={values.sender_phone}
        onChange={(v) => setValues({ ...values, sender_phone: v })}
      />
      <Field
        label="Dirección"
        value={values.sender_address}
        onChange={(v) => setValues({ ...values, sender_address: v })}
      />
      <Field
        label="Prefijo de número de pedido"
        value={values.order_prefix}
        onChange={(v) => setValues({ ...values, order_prefix: v })}
      />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando…" : "Guardar"}
      </Button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
