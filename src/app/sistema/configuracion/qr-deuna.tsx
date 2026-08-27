"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { subirQrDeunaAction, quitarQrDeunaAction } from "./actions";

/**
 * Subir la foto del QR de DeUna.
 *
 * El porqué está en `actions.ts`: el QR que enseña la app del banco no
 * tiene por qué ser la misma cadena que el enlace de compartir, así que
 * regenerarlo podría dar un código que no escanea. Se sube tal cual.
 */
export function QrDeuna({ actual }: { actual: string | null }) {
  const router = useRouter();
  const formulario = useRef<HTMLFormElement>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [trabajando, startTrabajo] = useTransition();

  function onSubir(fd: FormData) {
    startTrabajo(async () => {
      const r = await subirQrDeunaAction(fd);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("QR guardado");
      formulario.current?.reset();
      setVistaPrevia(null);
      router.refresh();
    });
  }

  function onQuitar() {
    startTrabajo(async () => {
      await quitarQrDeunaAction();
      toast.success("QR quitado");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {actual ? (
        <div className="flex items-start gap-4">
          <div className="relative size-28 shrink-0 overflow-hidden rounded-lg border bg-white">
            <Image
              src={actual}
              alt="Código QR de DeUna"
              fill
              sizes="112px"
              className="object-contain p-1"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">QR cargado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Es el que ve el cliente en la página de su pedido, debajo del
              botón de pagar.
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 -ml-2"
              disabled={trabajando}
              onClick={onQuitar}
            >
              <Trash2 className="size-4 text-destructive" /> Quitar
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Sin QR cargado. Mientras tanto, si hay un enlace de DeUna arriba, la
          tienda genera un código a partir de él.
        </p>
      )}

      <form ref={formulario} action={onSubir} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="qr">
            {actual ? "Reemplazar el QR" : "Subir el QR de DeUna"}
          </Label>
          <Input
            id="qr"
            name="qr"
            type="file"
            accept="image/*"
            required
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              /*
                Con <img> y no con next/image: la dirección "blob:" que
                arma el navegador al elegir un archivo solo existe en esta
                pestaña y el optimizador del servidor no puede verla.
              */
              setVistaPrevia(archivo ? URL.createObjectURL(archivo) : null);
            }}
          />
          <p className="text-xs text-muted-foreground">
            Una captura del QR desde la app de DeUna. Recórtala para que quede
            solo el código: si entra el resto de la pantalla, se lee más
            difícil.
          </p>
        </div>

        {vistaPrevia && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vistaPrevia}
            alt=""
            className="size-28 rounded-lg border bg-white object-contain p-1"
          />
        )}

        <Button type="submit" disabled={trabajando}>
          <Upload className="size-4" />
          {trabajando ? "Guardando…" : "Guardar QR"}
        </Button>
      </form>
    </div>
  );
}
