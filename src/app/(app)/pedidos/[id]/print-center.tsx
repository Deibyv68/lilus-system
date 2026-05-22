"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Printer,
  FileText,
  AlertTriangle,
  Move,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sticker,
} from "lucide-react";

type Missing = { id: string; name: string; sku: string };

const OFFSET_STORAGE_KEY = "lilus.productLabelOffset";
const STEP_MM = 0.5;
const MAX_MM = 20;

export function PrintCenter({
  orderId,
  missingLabels,
  packCount,
}: {
  orderId: string;
  missingLabels: Missing[];
  packCount: number;
}) {
  const [openedAny, setOpenedAny] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [boxLogoCopies, setBoxLogoCopies] = useState(Math.max(1, packCount));

  // Cargar último offset usado (por navegador)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(OFFSET_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { x: number; y: number };
        if (typeof parsed.x === "number") setOffsetX(clamp(parsed.x));
        if (typeof parsed.y === "number") setOffsetY(clamp(parsed.y));
      }
    } catch {}
  }, []);

  // Persistir cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem(
        OFFSET_STORAGE_KEY,
        JSON.stringify({ x: offsetX, y: offsetY })
      );
    } catch {}
  }, [offsetX, offsetY]);

  function clamp(v: number) {
    return Math.max(-MAX_MM, Math.min(MAX_MM, v));
  }

  function openShipping() {
    setOpenedAny(true);
    window.open(`/api/orders/${orderId}/shipping-label`, "_blank", "noopener");
  }

  function openExpiry() {
    setOpenedAny(true);
    window.open(`/api/orders/${orderId}/expiry-labels`, "_blank", "noopener");
  }

  function openBoxLogo() {
    setOpenedAny(true);
    const params = new URLSearchParams();
    params.set("copies", String(boxLogoCopies));
    window.open(
      `/api/orders/${orderId}/box-logo?${params.toString()}`,
      "_blank",
      "noopener"
    );
  }

  function openProductLabels() {
    setOpenedAny(true);
    const params = new URLSearchParams();
    if (offsetX !== 0) params.set("offsetX", String(offsetX));
    if (offsetY !== 0) params.set("offsetY", String(offsetY));
    const qs = params.toString();
    window.open(
      `/api/orders/${orderId}/product-labels${qs ? `?${qs}` : ""}`,
      "_blank",
      "noopener"
    );
  }

  function resetOffset() {
    setOffsetX(0);
    setOffsetY(0);
  }

  const isAdjusted = offsetX !== 0 || offsetY !== 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="size-5" />
          Centro de impresión
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Cada botón abre el PDF en una nueva pestaña. Usa Ctrl+P y selecciona
          la impresora MUNBYN configurada en Windows.
        </p>

        {/* Etiqueta de envío */}
        <Button
          type="button"
          className="w-full justify-start h-auto py-3"
          onClick={openShipping}
        >
          <Printer className="size-4 shrink-0" />
          <span className="flex-1 text-left">
            <span className="block text-sm font-medium">Etiqueta de envío</span>
            <span className="block text-[11px] font-normal opacity-75">
              4×6 pulgadas · MUNBYN
            </span>
          </span>
        </Button>

        {/* Logo de caja — solo si el pedido tiene packs */}
        {packCount > 0 && (
          <div className="rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-3 space-y-3">
            <div className="flex items-start gap-2">
              <Sticker className="size-4 mt-0.5 text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Logo para caja de envío</p>
                <p className="text-[11px] text-muted-foreground">
                  Este pedido lleva {packCount} pack{packCount > 1 ? "s" : ""}.
                  Imprime el sello LILUS para pegar en la caja.
                </p>
              </div>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-[11px] font-medium">
                  Cantidad de copias
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={boxLogoCopies}
                  onChange={(e) =>
                    setBoxLogoCopies(
                      Math.max(1, Math.min(20, parseInt(e.target.value || "1", 10)))
                    )
                  }
                  className="h-8 mt-1 tabular-nums"
                />
              </div>
              <Button
                type="button"
                onClick={openBoxLogo}
                className="h-8"
              >
                <Sticker className="size-4" /> Generar logo
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Formato 4×4 pulgadas (sticker cuadrado). Por defecto se imprime
              una por cada pack en el pedido.
            </p>
          </div>
        )}

        {/* Etiquetas de producto + ajuste de offset */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="size-4 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Etiquetas de producto</p>
              <p className="text-[11px] text-muted-foreground">
                PDFs subidos por cada producto · una etiqueta por unidad
              </p>
            </div>
          </div>

          {/* Panel de ajuste de posición */}
          <div className="rounded-md bg-background border p-3 space-y-3">
            <div className="flex items-start gap-2">
              <Move className="size-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold leading-tight">
                  Ajustar posición (mm)
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  Si la etiqueta sale ligeramente descuadrada en la impresora,
                  mueve el diseño antes de imprimir.
                  <br />
                  <strong>Horizontal (X):</strong> + derecha, − izquierda.
                  <br />
                  <strong>Vertical (Y):</strong> + arriba, − abajo.
                  <br />
                  El ajuste se recuerda en este navegador para los próximos
                  pedidos.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <OffsetInput
                label="X (horizontal)"
                iconMinus={<ArrowLeft className="size-3.5" />}
                iconPlus={<ArrowRight className="size-3.5" />}
                value={offsetX}
                onChange={(v) => setOffsetX(clamp(v))}
              />
              <OffsetInput
                label="Y (vertical)"
                iconMinus={<ArrowDown className="size-3.5" />}
                iconPlus={<ArrowUp className="size-3.5" />}
                value={offsetY}
                onChange={(v) => setOffsetY(clamp(v))}
              />
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">
                {isAdjusted ? (
                  <>
                    Ajuste actual:{" "}
                    <strong className="text-foreground tabular-nums">
                      X {offsetX > 0 ? "+" : ""}
                      {offsetX} mm · Y {offsetY > 0 ? "+" : ""}
                      {offsetY} mm
                    </strong>
                  </>
                ) : (
                  "Sin ajuste (imprime tal cual el PDF original)"
                )}
              </span>
              {isAdjusted && (
                <button
                  type="button"
                  onClick={resetOffset}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <RotateCcw className="size-3" /> Restablecer
                </button>
              )}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={openProductLabels}
          >
            <FileText className="size-4" />
            {isAdjusted ? "Generar e imprimir con ajuste" : "Generar e imprimir"}
          </Button>
        </div>

        {/* Etiquetas 2x1 */}
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start h-auto py-3"
          onClick={openExpiry}
        >
          <FileText className="size-4 shrink-0" />
          <span className="flex-1 text-left">
            <span className="block text-sm font-medium">
              Etiquetas 2×1 (caducidad)
            </span>
            <span className="block text-[11px] font-normal opacity-75">
              Lote y fecha de caducidad · una por unidad física
            </span>
          </span>
        </Button>

        {missingLabels.length > 0 && (
          <Alert>
            <AlertTriangle className="size-4" />
            <AlertTitle>Faltan etiquetas PDF de algunos productos</AlertTitle>
            <AlertDescription>
              <ul className="text-xs mt-1 list-disc pl-4">
                {missingLabels.map((m) => (
                  <li key={m.id}>
                    {m.name} <span className="font-mono">({m.sku})</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs mt-2">
                Súbelos desde la ficha de cada producto.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {openedAny && (
          <p className="text-[11px] text-muted-foreground border-t pt-2">
            Si tu navegador bloqueó las pestañas, permite popups para este
            sitio.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function OffsetInput({
  label,
  iconMinus,
  iconPlus,
  value,
  onChange,
}: {
  label: string;
  iconMinus: React.ReactNode;
  iconPlus: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label className="text-[11px] font-medium">{label}</Label>
      <div className="flex items-center gap-1 mt-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8 shrink-0"
          onClick={() => onChange(value - STEP_MM)}
          aria-label="Disminuir"
        >
          {iconMinus}
        </Button>
        <Input
          type="number"
          step={STEP_MM}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value || "0"))}
          className="h-8 text-center tabular-nums px-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8 shrink-0"
          onClick={() => onChange(value + STEP_MM)}
          aria-label="Aumentar"
        >
          {iconPlus}
        </Button>
      </div>
    </div>
  );
}
