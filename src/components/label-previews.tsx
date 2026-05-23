"use client";

import { Move } from "lucide-react";

type PrintKind = "shipping" | "product-labels" | "expiry-labels" | "box-logo";

export function CircularPreview({
  offsetX,
  offsetY,
  kind,
}: {
  offsetX: number;
  offsetY: number;
  kind: PrintKind;
}) {
  // 51mm de label, escalamos a 200px (≈3.92px/mm)
  const PX_PER_MM = 200 / 51;
  const labelPx = 200;
  const dx = offsetX * PX_PER_MM;
  const dy = -offsetY * PX_PER_MM; // Y+ en PDF es hacia arriba; en pantalla es hacia abajo

  return (
    <div className="rounded-lg border p-4 bg-muted/30">
      <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
        <Move className="size-3" />
        Vista previa ·{" "}
        {kind === "box-logo" ? "Logo de caja" : "Etiqueta circular"}
      </p>
      <div className="flex justify-center">
        <div
          className="relative bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-300 dark:border-zinc-700"
          style={{ width: `${labelPx}px`, height: `${labelPx}px` }}
        >
          {/* Cruz de centro de referencia */}
          <div
            className="absolute top-1/2 left-0 right-0 border-t border-zinc-200 dark:border-zinc-800"
            style={{ transform: "translateY(-50%)" }}
          />
          <div
            className="absolute left-1/2 top-0 bottom-0 border-l border-zinc-200 dark:border-zinc-800"
            style={{ transform: "translateX(-50%)" }}
          />

          {/* Círculo del diseño (representa el contenido de la etiqueta) */}
          <div
            className="absolute rounded-full border-4 border-foreground flex flex-col items-center justify-center text-foreground transition-transform"
            style={{
              width: `${labelPx * 0.85}px`,
              height: `${labelPx * 0.85}px`,
              left: `${labelPx * 0.075}px`,
              top: `${labelPx * 0.075}px`,
              transform: `translate(${dx}px, ${dy}px)`,
            }}
          >
            <span className="text-lg font-black">LILUS</span>
            <span className="text-[8px] italic opacity-70">
              {kind === "box-logo" ? "Ilumina tu belleza" : "Etiqueta"}
            </span>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground text-center mt-3">
        {offsetX === 0 && offsetY === 0 ? (
          <>Centrada · sin ajuste</>
        ) : (
          <>
            Ajuste: X {offsetX > 0 ? "+" : ""}
            {offsetX} mm · Y {offsetY > 0 ? "+" : ""}
            {offsetY} mm
          </>
        )}
      </p>
    </div>
  );
}

export function ShippingPreview({ sampleName }: { sampleName?: string }) {
  return (
    <div className="rounded-lg border p-4 bg-muted/30">
      <p className="text-xs font-medium text-muted-foreground mb-3">
        Vista previa · Etiqueta 4×6"
      </p>
      <div className="rounded-lg bg-white dark:bg-zinc-900 border p-3 text-xs space-y-2 aspect-[4/6] max-w-[200px] mx-auto">
        <div className="font-black text-base">LILUS</div>
        <div className="border-t pt-2">
          <p className="text-[9px] text-muted-foreground uppercase">
            Destinatario
          </p>
          <p className="font-bold">{sampleName ?? "Nombre del cliente"}</p>
          <p className="text-[10px]">Dirección de envío</p>
          <p className="text-[10px]">Ciudad, Provincia</p>
        </div>
        <div className="mt-auto border-t pt-2">
          <div className="h-6 bg-zinc-900 dark:bg-zinc-100" />
          <p className="text-center text-[8px] mt-1 font-mono">LILUS-000000</p>
        </div>
      </div>
    </div>
  );
}

export function ExpiryPreview({
  productName,
  batchCode,
}: {
  productName?: string;
  batchCode?: string;
}) {
  return (
    <div className="rounded-lg border p-4 bg-muted/30">
      <p className="text-xs font-medium text-muted-foreground mb-3">
        Vista previa · Etiqueta 2×1"
      </p>
      <div className="rounded bg-white dark:bg-zinc-900 border p-2 text-[10px] aspect-[2/1] max-w-[220px] mx-auto">
        <p className="font-bold leading-tight">
          {productName ?? "Producto"}
        </p>
        <p className="text-muted-foreground font-mono text-[8px] mt-0.5">
          {batchCode ?? "L20260101-001"}
        </p>
        <div className="border-t my-1" />
        <div className="flex justify-between">
          <div>
            <p className="text-muted-foreground text-[7px]">ELAB</p>
            <p className="font-bold text-[9px]">01/01/2026</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-[7px]">VENCE</p>
            <p className="font-bold text-[9px]">01/01/2027</p>
          </div>
        </div>
      </div>
    </div>
  );
}
