"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { numeroDeGuia } from "@/lib/leer-guia";

/**
 * Leer el número de guía con la cámara.
 *
 * ── Qué ahorra ──
 *
 * La etiqueta de Servientrega trae el número impreso y un código que lo
 * repite. Copiarlo a mano son catorce dígitos leídos de un papel pequeño,
 * casi siempre de pie y con el paquete en la otra mano — y un dígito mal
 * copiado no falla aquí: falla dos días después, cuando la clienta abre
 * el enlace de rastreo y no encuentra su envío.
 *
 * ── Por qué sin librería de códigos ──
 *
 * Chrome en Android trae `BarcodeDetector` de fábrica, y ese es el
 * navegador donde se usa el panel. Meter un lector propio serían cientos
 * de kilobytes que descarga cada visita para algo que el teléfono ya sabe
 * hacer.
 *
 * Donde no exista, el botón no aparece: es mejor no ofrecerlo que
 * ofrecerlo y que no pase nada al tocarlo. Escribir a mano sigue estando.
 */

/*
  Los formatos que llevan las etiquetas de transportadora en Ecuador.

  Se piden todos los que valen en vez de solo QR: Servientrega imprime
  código de barras en unas guías y QR en otras, y quien escanea no
  debería tener que saber cuál le tocó.
*/
const FORMATOS = [
  "qr_code",
  "code_128",
  "code_39",
  "codabar",
  "itf",
  "ean_13",
];

type Detector = {
  detect: (fuente: CanvasImageSource) => Promise<{ rawValue: string }[]>;
};

/** ¿Puede este navegador leer códigos por su cuenta? */
function hayLector(): boolean {
  return typeof window !== "undefined" && "BarcodeDetector" in window;
}

export function EscanearGuia({
  onLeido,
}: {
  onLeido: (numero: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);

  /*
    Preguntar por el lector es leer algo de FUERA de React, y que además
    no existe en el servidor. `useSyncExternalStore` está hecho para
    justo eso: da una respuesta al pintar en el servidor —que no hay— y
    otra en el navegador, sin que los dos HTML dejen de coincidir.

    Con un estado y un efecto también «funciona», pero pinta una vez de
    más y React avisa con razón: nada externo ha cambiado, solo nos
    enteramos tarde.
  */
  const soportado = useSyncExternalStore(
    // No hay a qué suscribirse: esto no cambia mientras la página vive.
    () => () => {},
    () => hayLector(),
    () => false
  );

  if (!soportado) return null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setAbierto(true)}
      >
        <Camera className="size-4" />
        Escanear la guía
      </Button>

      {abierto && (
        <Camara
          onCerrar={() => setAbierto(false)}
          onLeido={(n) => {
            setAbierto(false);
            onLeido(n);
          }}
        />
      )}
    </>
  );
}

function Camara({
  onLeido,
  onCerrar,
}: {
  onLeido: (numero: string) => void;
  onCerrar: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    let flujo: MediaStream | null = null;
    let reloj: ReturnType<typeof setInterval> | null = null;

    (async () => {
      try {
        flujo = await navigator.mediaDevices.getUserMedia({
          // La de atrás: nadie escanea una etiqueta con la cámara frontal.
          video: { facingMode: { ideal: "environment" } },
        });
        if (!vivo || !video.current) {
          flujo.getTracks().forEach((t) => t.stop());
          return;
        }
        video.current.srcObject = flujo;
        await video.current.play();

        const Lector = (
          window as unknown as {
            BarcodeDetector: new (o: { formats: string[] }) => Detector;
          }
        ).BarcodeDetector;
        const lector = new Lector({ formats: FORMATOS });

        /*
          Se mira cada 400 ms en vez de en cada fotograma.

          Leer 30 veces por segundo calienta el teléfono y no encuentra el
          código antes: lo que tarda es que la persona lo encuadre. A este
          ritmo se lee en cuanto entra en cuadro y la batería no se nota.
        */
        reloj = setInterval(async () => {
          if (!vivo || !video.current || video.current.readyState < 2) return;
          try {
            const encontrados = await lector.detect(video.current);
            for (const c of encontrados) {
              const numero = numeroDeGuia(c.rawValue);
              if (numero) {
                vivo = false;
                onLeido(numero);
                return;
              }
            }
          } catch {
            // Un fotograma que no se pudo analizar no es un fallo: se
            // vuelve a intentar con el siguiente.
          }
        }, 400);
      } catch (e) {
        if (!vivo) return;
        const nombre = (e as Error).name;
        setError(
          nombre === "NotAllowedError"
            ? "No diste permiso de cámara. Puedes escribir el número a mano."
            : "No se pudo abrir la cámara. Escribe el número a mano."
        );
      }
    })();

    return () => {
      vivo = false;
      if (reloj) clearInterval(reloj);
      /*
        Apagar la cámara al cerrar, siempre.

        Si el flujo se queda abierto, el teléfono deja la luz de la cámara
        encendida y sigue gastando batería con el panel en segundo plano.
      */
      flujo?.getTracks().forEach((t) => t.stop());
    };
  }, [onLeido]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <p className="text-sm">Apunta al código de la guía</p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCerrar}
          aria-label="Cerrar la cámara"
          className="text-white hover:bg-white/15 hover:text-white"
        >
          <X className="size-5" />
        </Button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video
          ref={video}
          playsInline
          muted
          className="size-full object-cover"
        />
        {/*
          El recuadro guía. No recorta nada —se analiza el fotograma
          entero— pero dice dónde poner el código, y con él la gente
          acierta a la primera en vez de pasear el teléfono.
        */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="h-40 w-72 rounded-lg border-2 border-white/80 shadow-[0_0_0_100vmax_rgba(0,0,0,0.45)]" />
        </div>
      </div>

      {error && (
        <p role="alert" className="bg-black px-4 py-4 text-sm text-white">
          {error}
        </p>
      )}
    </div>
  );
}
