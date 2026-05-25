"use client";

import { useEffect, useState } from "react";
import { Loader2, FileWarning, ExternalLink } from "lucide-react";
import { PrinterDot } from "./printer-dot";

/**
 * Muestra el preview de un PDF como imagen PNG. La PNG se genera en el
 * servidor renderizando el PDF real (con pdf-to-png-converter), por lo
 * que es una reproducción exacta de lo que va a imprimirse, no una
 * recreación HTML separada.
 *
 * El endpoint del PDF debe soportar `?format=png` para devolver imagen
 * en lugar de PDF (todos los endpoints de LILUS lo hacen).
 *
 * Funciona en cualquier navegador (móvil incluido) porque solo usa <img>.
 */
export function PdfPreview({
  url,
  label,
  aspectRatio = "1 / 1",
  maxWidth = 220,
}: {
  url: string;
  label?: string;
  aspectRatio?: string;
  maxWidth?: number;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [cacheKey, setCacheKey] = useState(0);

  // Cuando cambia la URL (por offset, etc.) recargamos
  useEffect(() => {
    setLoaded(false);
    setError(false);
    setCacheKey((c) => c + 1);
  }, [url]);

  // Construimos la URL PNG agregando format=png + cache-bust
  const pngUrl = (() => {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}format=png&_t=${cacheKey}`;
  })();

  // URL del PDF original para "Abrir en pestaña"
  const pdfUrl = url;

  return (
    <div className="relative rounded-lg border p-4 bg-muted/30">
      {/* Indicador discreto de estado de la impresora */}
      <div className="absolute top-3 right-3 z-10">
        <PrinterDot />
      </div>

      {label && (
        <p className="text-xs font-medium text-muted-foreground mb-3 pr-6">
          Vista previa · {label}
        </p>
      )}

      <div
        className="relative mx-auto bg-white dark:bg-zinc-100 shadow-sm rounded-sm overflow-hidden"
        style={{ maxWidth: `${maxWidth}px`, aspectRatio }}
      >
        {!loaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center">
            <FileWarning className="size-6 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground leading-tight">
              No se pudo generar el preview
            </p>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-primary inline-flex items-center gap-1 underline"
            >
              <ExternalLink className="size-3" /> Abrir PDF
            </a>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={cacheKey}
            src={pngUrl}
            alt={label ?? "preview"}
            className="w-full h-full object-contain block"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        )}
      </div>

      <p className="text-[10px] text-muted-foreground text-center mt-2">
        Esta es exactamente la etiqueta que saldrá impresa.
      </p>
    </div>
  );
}
