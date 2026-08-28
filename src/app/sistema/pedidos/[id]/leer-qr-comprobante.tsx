"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { numeroDeGuia } from "@/lib/leer-guia";

/**
 * Leer el QR que el propio comprobante trae impreso.
 *
 * ── Qué aporta sobre el OCR ──
 *
 * El OCR adivina letras a partir de píxeles y se equivoca: un 8 por un
 * 0, un 1 por un 7. El QR no adivina nada — o se lee entero y exacto, o
 * no se lee. Cuando un comprobante lo trae, ese número es el bueno.
 *
 * Los de Banco Pichincha dicen «Verificar la transacción con este QR» y
 * llevan dentro la dirección donde el propio banco confirma el
 * movimiento. Eso es más de lo que puede dar cualquier lectura de la
 * imagen: no solo el número, sino dónde comprobarlo.
 *
 * ── Por qué desde la imagen y no con la cámara ──
 *
 * Porque la imagen ya está aquí. Apuntar la cámara a la pantalla del
 * teléfono donde está la captura sería fotografiar una foto, con el
 * reflejo y el moiré de regalo.
 *
 * Donde el navegador no sepa leer códigos, el botón no aparece: es mejor
 * no ofrecerlo que ofrecerlo y que no pase nada al tocarlo.
 */

type Detector = {
  detect: (fuente: CanvasImageSource) => Promise<{ rawValue: string }[]>;
};

function hayLector(): boolean {
  return typeof window !== "undefined" && "BarcodeDetector" in window;
}

export function LeerQrDelComprobante({
  src,
  onNumero,
}: {
  /** La imagen del comprobante, ya servida por la ruta con sesión. */
  src: string;
  onNumero: (numero: string) => void;
}) {
  const [leyendo, empezar] = useTransition();
  const [enlace, setEnlace] = useState<string | null>(null);

  /*
    Igual que en el escáner de guías: preguntar por el lector es leer
    algo de fuera de React que además no existe en el servidor.
  */
  const soportado = useSyncExternalStore(
    () => () => {},
    () => hayLector(),
    () => false
  );

  if (!soportado) return null;

  function leer() {
    empezar(async () => {
      try {
        /*
          La imagen se pide otra vez con `fetch` y se decodifica a un
          mapa de bits, en vez de reutilizar la etiqueta `<img>` de la
          página.

          Esa está escalada para caber en la tarjeta —hasta 420 px de
          alto— y un QR reducido pierde los cuadros pequeños que lo
          hacen legible. Aquí llega a su tamaño original.

          `credentials: "same-origin"` porque la ruta exige la cookie de
          sesión: sin ella responde 404, como a cualquier extraño.
        */
        const r = await fetch(src, { credentials: "same-origin" });
        if (!r.ok) throw new Error("no se pudo abrir la imagen");
        const bitmap = await createImageBitmap(await r.blob());

        const Lector = (
          window as unknown as {
            BarcodeDetector: new (o: { formats: string[] }) => Detector;
          }
        ).BarcodeDetector;
        const encontrados = await new Lector({
          formats: ["qr_code", "code_128", "code_39", "itf"],
        }).detect(bitmap);
        bitmap.close();

        if (encontrados.length === 0) {
          toast.error("No se encontró ningún código en esta imagen");
          return;
        }

        const crudo = encontrados[0].rawValue;

        /*
          Si lo leído es una dirección web, se ofrece abrirla: es la
          página del banco donde se verifica el movimiento, que vale más
          que cualquier cifra que podamos sacar nosotros.
        */
        if (/^https?:\/\//i.test(crudo.trim())) setEnlace(crudo.trim());

        const numero = numeroDeGuia(crudo);
        if (numero) {
          onNumero(numero);
          toast.success(`El código dice ${numero}`);
        } else {
          toast.success("Código leído", {
            description: crudo.slice(0, 80),
          });
        }
      } catch (e) {
        console.error("[qr] No se pudo leer el código:", e);
        toast.error("No se pudo leer el código de esta imagen");
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        disabled={leyendo}
        onClick={leer}
      >
        <QrCode className="size-3.5" />
        {leyendo ? "Leyendo…" : "Leer el QR"}
      </Button>

      {enlace && (
        <a
          href={enlace}
          target="_blank"
          rel="noreferrer"
          className="block text-2xs text-primary hover:underline"
        >
          Verificar en la página del banco
        </a>
      )}
    </>
  );
}
