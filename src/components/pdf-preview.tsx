"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, FileWarning, ExternalLink } from "lucide-react";

/**
 * Muestra el PDF real que se va a imprimir embebido en un iframe.
 * No es una "recreación" en HTML — es exactamente el byte que la impresora
 * recibirá.
 *
 * Notas de compatibilidad:
 * - Chrome (desktop / Android): renderiza inline perfectamente.
 * - iOS Safari: a veces no muestra PDFs en iframes. Para esos casos
 *   mostramos un fallback con un botón para abrir en pestaña nueva.
 * - Cuando la URL cambia (por offset, unitIndex…) el iframe se refresca.
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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Cache-bust por cambios de URL — agregamos timestamp a la URL para que
  // el navegador descargue el PDF nuevo cuando cambia el offset, etc.
  const [cacheKey, setCacheKey] = useState(0);
  useEffect(() => {
    setLoaded(false);
    setError(false);
    setCacheKey((c) => c + 1);
  }, [url]);

  const fullUrl = `${url}${url.includes("?") ? "&" : "?"}_t=${cacheKey}`;

  return (
    <div className="rounded-lg border p-4 bg-muted/30">
      {label && (
        <p className="text-xs font-medium text-muted-foreground mb-3">
          Vista previa · {label}
        </p>
      )}

      <div
        className="relative mx-auto bg-white dark:bg-zinc-100 shadow-sm rounded-sm overflow-hidden"
        style={{
          maxWidth: `${maxWidth}px`,
          aspectRatio,
        }}
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
              Tu navegador no muestra PDFs aquí
            </p>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-primary inline-flex items-center gap-1 underline"
            >
              <ExternalLink className="size-3" /> Abrir en pestaña
            </a>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            key={cacheKey}
            src={fullUrl}
            title="PDF preview"
            className="w-full h-full block border-0"
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
