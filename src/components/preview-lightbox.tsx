"use client";

import { useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { X, ZoomIn, ZoomOut, RotateCcw, Download } from "lucide-react";

/**
 * Visor de preview a pantalla completa con zoom y pan.
 *
 * - Móvil: pinch para zoom, drag para pan
 * - Desktop: scroll para zoom, drag para pan
 * - ESC o tap fuera de la imagen para cerrar
 */
export function PreviewLightbox({
  open,
  onClose,
  imageUrl,
  pdfUrl,
  title,
}: {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  pdfUrl?: string;
  title?: string;
}) {
  // Cerrar con ESC
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    // Bloquear scroll del body
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 bg-gradient-to-b from-black/70 to-transparent">
        <div className="text-white min-w-0 px-2">
          <p className="text-sm font-semibold truncate">{title ?? "Vista previa"}</p>
          <p className="text-[10px] opacity-70">
            Pellizca o usa la rueda para hacer zoom · Arrastra para mover
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="size-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              title="Abrir PDF original"
            >
              <Download className="size-5" />
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="size-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* Contenido con zoom */}
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={8}
        centerOnInit
        doubleClick={{ mode: "toggle", step: 2 }}
        wheel={{ step: 0.2 }}
        pinch={{ step: 5 }}
        panning={{ velocityDisabled: true }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <TransformComponent
              wrapperStyle={{
                width: "100%",
                height: "100%",
                cursor: "grab",
              }}
              contentStyle={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={title ?? "preview"}
                className="max-w-[95vw] max-h-[85vh] object-contain select-none"
                draggable={false}
              />
            </TransformComponent>

            {/* Controles inferiores */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-2 py-1.5">
              <button
                type="button"
                onClick={() => zoomOut()}
                aria-label="Alejar"
                className="size-9 rounded-full hover:bg-white/15 text-white flex items-center justify-center"
              >
                <ZoomOut className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => resetTransform()}
                aria-label="Restablecer"
                className="size-9 rounded-full hover:bg-white/15 text-white flex items-center justify-center"
              >
                <RotateCcw className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => zoomIn()}
                aria-label="Acercar"
                className="size-9 rounded-full hover:bg-white/15 text-white flex items-center justify-center"
              >
                <ZoomIn className="size-4" />
              </button>
            </div>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}
