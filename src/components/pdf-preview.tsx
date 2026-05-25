"use client";

import { useEffect, useState } from "react";
import { Loader2, FileWarning, ExternalLink, ZoomIn } from "lucide-react";
import { PrinterDot } from "./printer-dot";
import { PreviewLightbox } from "./preview-lightbox";

/**
 * Muestra el preview de un PDF como imagen PNG. La PNG se genera en el
 * servidor renderizando el PDF real, así es 1:1 lo que va a imprimirse.
 *
 * Al hacer click/tap en la imagen se abre un lightbox a pantalla completa
 * con zoom y pan (gestos pinch en móvil, scroll en desktop).
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
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setError(false);
    setCacheKey((c) => c + 1);
  }, [url]);

  const pngUrl = (() => {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}format=png&_t=${cacheKey}`;
  })();

  return (
    <>
      <div className="relative rounded-lg border p-4 bg-muted/30">
        <div className="absolute top-3 right-3 z-10">
          <PrinterDot />
        </div>

        {label && (
          <p className="text-xs font-medium text-muted-foreground mb-3 pr-6">
            Vista previa · {label}
          </p>
        )}

        <button
          type="button"
          onClick={() => loaded && !error && setLightboxOpen(true)}
          disabled={!loaded || error}
          className="relative mx-auto block bg-white dark:bg-zinc-100 shadow-sm rounded-sm overflow-hidden disabled:cursor-not-allowed cursor-zoom-in group"
          style={{
            maxWidth: `${maxWidth}px`,
            width: `${maxWidth}px`,
            aspectRatio,
          }}
          aria-label="Ampliar previa"
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
                href={url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] text-primary inline-flex items-center gap-1 underline"
              >
                <ExternalLink className="size-3" /> Abrir PDF
              </a>
            </div>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={cacheKey}
                src={pngUrl}
                alt={label ?? "preview"}
                className="w-full h-full object-contain block"
                onLoad={() => setLoaded(true)}
                onError={() => setError(true)}
              />
              {/* Indicador "tocar para ampliar" — visible solo cuando carga */}
              {loaded && (
                <div className="absolute bottom-1.5 right-1.5 size-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                  <ZoomIn className="size-3.5" />
                </div>
              )}
            </>
          )}
        </button>

        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Toca la imagen para ampliar
        </p>
      </div>

      <PreviewLightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        imageUrl={pngUrl}
        pdfUrl={url}
        title={label}
      />
    </>
  );
}
