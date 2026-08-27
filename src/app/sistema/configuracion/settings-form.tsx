"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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

      {/* Cobro */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Cobro de la tienda
        </h3>
        <Field
          label="Enlace de cobro de DeUna"
          value={values.deuna_enlace ?? ""}
          onChange={(v) => update("deuna_enlace", v)}
          placeholder="https://…"
          hint="En la app DeUna: «Envía un link de cobro», sin monto, y pega el enlace aquí. La tienda lo convierte en un QR y en un botón para pagar."
        />

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Datos para la transferencia</Label>
          <Textarea
            value={values.bank_details ?? ""}
            onChange={(e) => update("bank_details", e.target.value)}
            placeholder="Banco, tipo de cuenta, número, nombre y cédula del titular"
            rows={5}
          />
          <p className="text-xs text-muted-foreground">
            Es lo que ve el cliente al terminar su pedido en la web. Si lo
            dejas vacío, la tienda le dice que se los enviamos por WhatsApp
            en vez de mostrar una cuenta equivocada.
          </p>
        </div>
      </div>

      {/* Contacto publico */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Contacto en la tienda
        </h3>
        <Field
          label="WhatsApp"
          value={values.contact_whatsapp ?? ""}
          onChange={(v) => update("contact_whatsapp", v)}
          placeholder="593991234567"
          hint="Con código de país y sin signos. Es el enlace que usa el cliente para mandar el comprobante."
        />
        <Field
          label="Instagram"
          value={values.contact_instagram ?? ""}
          onChange={(v) => update("contact_instagram", v)}
          placeholder="lilus.ec"
          hint="Solo el usuario, sin la arroba."
        />
        <p className="text-xs text-muted-foreground">
          Las fotos del feed de la portada se suben en{" "}
          <a
            href="/sistema/configuracion/feed"
            className="underline underline-offset-2"
          >
            Feed de la portada
          </a>
          .
        </p>
        <Field
          label="TikTok"
          value={values.contact_tiktok ?? ""}
          onChange={(v) => update("contact_tiktok", v)}
          placeholder="lilus.ec"
          hint="Solo el usuario, sin la arroba."
        />
      </div>

      {/* Cinta de promocion */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Cinta de promoción
        </h3>

        <div className="flex items-start justify-between gap-4">
          <div>
            <Label htmlFor="promo_activa">Mostrarla en la tienda</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Es la franja que se desplaza arriba del todo.
            </p>
          </div>
          <Switch
            id="promo_activa"
            checked={values.promo_activa === "true"}
            onCheckedChange={(v) => update("promo_activa", v ? "true" : "false")}
          />
        </div>

        <Field
          label="Texto"
          value={values.promo_texto ?? ""}
          onChange={(v) => update("promo_texto", v)}
          placeholder="Envío gratis en pedidos desde $30"
          hint="Corto. Se repite en bucle, así que una frase larga se lee a medias."
        />
        <Field
          label="A dónde lleva (opcional)"
          value={values.promo_enlace ?? ""}
          onChange={(v) => update("promo_enlace", v)}
          placeholder="/tienda"
          hint="Si lo dejas vacío, la cinta no es un enlace."
        />

        {values.promo_activa === "true" && !values.promo_texto?.trim() && (
          <p className="text-xs text-amber-600 dark:text-amber-500">
            Está encendida pero sin texto, así que la tienda no la va a
            mostrar. Escribe algo o apágala.
          </p>
        )}
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
      {hint && <p className="text-2xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
