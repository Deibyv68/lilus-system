"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Package2,
  Boxes,
  Printer,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Move,
  RotateCcw,
  Check,
  Loader2,
  AlertTriangle,
  WifiOff,
} from "lucide-react";
import { PdfPreview } from "@/components/pdf-preview";

type Product = { id: string; sku: string; name: string };
type Kind = "product-labels" | "box-logo";

const STEP_MM = 0.5;
const MAX_MM = 20;
const OFFSET_STORAGE_KEY = "lilus.productLabelOffset";

export function StandalonePrint({
  products,
  agentEnabled,
}: {
  products: Product[];
  agentEnabled: boolean;
}) {
  const [kind, setKind] = useState<Kind>("product-labels");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [copies, setCopies] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [status, setStatus] = useState<
    "idle" | "sending" | "printing" | "done" | "failed"
  >("idle");

  // Cargar último offset usado
  useEffect(() => {
    try {
      const raw = localStorage.getItem(OFFSET_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { x: number; y: number };
        if (typeof parsed.x === "number") setOffsetX(clampOff(parsed.x));
        if (typeof parsed.y === "number") setOffsetY(clampOff(parsed.y));
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        OFFSET_STORAGE_KEY,
        JSON.stringify({ x: offsetX, y: offsetY })
      );
    } catch {}
  }, [offsetX, offsetY]);

  function clampOff(v: number) {
    return Math.max(-MAX_MM, Math.min(MAX_MM, v));
  }

  // ───────── URL del preview ─────────
  const previewUrl = (() => {
    if (kind === "product-labels") {
      if (!productId) return null;
      const params = new URLSearchParams();
      params.set("productId", productId);
      params.set("copies", "1");
      if (offsetX !== 0) params.set("offsetX", String(offsetX));
      if (offsetY !== 0) params.set("offsetY", String(offsetY));
      return `/api/print/standalone/product?${params}`;
    }
    // box-logo — también usa el offset compartido
    const params = new URLSearchParams();
    params.set("copies", "1");
    if (offsetX !== 0) params.set("offsetX", String(offsetX));
    if (offsetY !== 0) params.set("offsetY", String(offsetY));
    return `/api/print/standalone/box-logo?${params}`;
  })();

  // ───────── Acciones ─────────
  async function printNow() {
    if (kind === "product-labels" && !productId) {
      toast.error("Selecciona un producto");
      return;
    }

    if (!agentEnabled) {
      // Fallback: abrir PDF
      const params = new URLSearchParams();
      params.set("copies", String(copies));
      if (kind === "product-labels") {
        params.set("productId", productId);
        if (offsetX !== 0) params.set("offsetX", String(offsetX));
        if (offsetY !== 0) params.set("offsetY", String(offsetY));
        window.open(
          `/api/print/standalone/product?${params}`,
          "_blank",
          "noopener"
        );
      } else {
        if (offsetX !== 0) params.set("offsetX", String(offsetX));
        if (offsetY !== 0) params.set("offsetY", String(offsetY));
        window.open(
          `/api/print/standalone/box-logo?${params}`,
          "_blank",
          "noopener"
        );
      }
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/print/standalone/enqueue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          productId: kind === "product-labels" ? productId : undefined,
          copies,
          offsetX: offsetX !== 0 ? offsetX : undefined,
          offsetY: offsetY !== 0 ? offsetY : undefined,
        }),
      });
      const data = (await res.json()) as { jobId?: string; error?: string };
      if (!res.ok || !data.jobId) {
        throw new Error(data.error ?? "Error encolando trabajo");
      }
      setStatus("printing");

      // Polling
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const sres = await fetch(`/api/print-queue/${data.jobId}/status`);
        if (!sres.ok) continue;
        const sjob = (await sres.json()) as {
          status: string;
          error?: string;
        };
        if (sjob.status === "DONE") {
          setStatus("done");
          toast.success(
            `${copies} etiqueta${copies === 1 ? "" : "s"} impresa${copies === 1 ? "" : "s"} ✓`
          );
          setTimeout(() => setStatus("idle"), 2500);
          return;
        }
        if (sjob.status === "FAILED") {
          setStatus("failed");
          toast.error(sjob.error ?? "Error del agente");
          return;
        }
      }
      setStatus("failed");
      toast.error("Timeout esperando al agente");
    } catch (e) {
      setStatus("failed");
      toast.error((e as Error).message);
    }
  }

  if (products.length === 0 && kind === "product-labels") {
    return (
      <Alert>
        <AlertTriangle className="size-4" />
        <AlertTitle>Sin productos con etiqueta cargada</AlertTitle>
        <AlertDescription className="text-xs">
          Para imprimir etiquetas de producto, primero sube el PDF de la
          etiqueta en cada producto (en Productos → Editar producto).
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-5">
      {/* Aviso si el agente está desactivado */}
      {!agentEnabled && (
        <div className="flex items-center gap-2 text-xs p-2.5 rounded-lg border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300">
          <WifiOff className="size-4 shrink-0" />
          <span>
            Agente desactivado · se abrirá el PDF para imprimir manualmente
          </span>
        </div>
      )}

      {/* Selector de tipo */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setKind("product-labels")}
          className={`p-4 rounded-xl border-2 transition-all active:scale-95 ${
            kind === "product-labels"
              ? "border-primary bg-primary/5"
              : "border-border hover:bg-accent"
          }`}
        >
          <Package2
            className={`size-6 mx-auto mb-2 ${kind === "product-labels" ? "text-primary" : "text-muted-foreground"}`}
          />
          <p className="text-sm font-semibold">Etiqueta de producto</p>
          <p className="text-[11px] text-muted-foreground">
            Circular 2×2 de un jabón
          </p>
        </button>
        <button
          type="button"
          onClick={() => setKind("box-logo")}
          className={`p-4 rounded-xl border-2 transition-all active:scale-95 ${
            kind === "box-logo"
              ? "border-primary bg-primary/5"
              : "border-border hover:bg-accent"
          }`}
        >
          <Boxes
            className={`size-6 mx-auto mb-2 ${kind === "box-logo" ? "text-primary" : "text-muted-foreground"}`}
          />
          <p className="text-sm font-semibold">Logo de caja</p>
          <p className="text-[11px] text-muted-foreground">
            Sello LILUS circular 2×2
          </p>
        </button>
      </div>

      {/* Selector de producto */}
      {kind === "product-labels" && (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Producto</Label>
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Selecciona…" />
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}{" "}
                  <span className="text-muted-foreground text-xs ml-2">
                    {p.sku}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Preview */}
      {previewUrl && (
        <PdfPreview
          url={previewUrl}
          label="Vista de la etiqueta real"
          aspectRatio="1 / 1"
          maxWidth={220}
        />
      )}

      {/* Offset (para ambos stickers circulares — se comparte el valor) */}
      {(kind === "product-labels" || kind === "box-logo") && (
        <div className="rounded-lg border p-3 space-y-3">
          <div className="flex items-start gap-2">
            <Move className="size-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium leading-tight">
                Ajustar posición (mm)
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                X: + derecha, − izquierda · Y: + arriba, − abajo
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <OffsetField
              label="X"
              value={offsetX}
              iconMinus={<ArrowLeft className="size-3.5" />}
              iconPlus={<ArrowRight className="size-3.5" />}
              onChange={(v) => setOffsetX(clampOff(v))}
            />
            <OffsetField
              label="Y"
              value={offsetY}
              iconMinus={<ArrowDown className="size-3.5" />}
              iconPlus={<ArrowUp className="size-3.5" />}
              onChange={(v) => setOffsetY(clampOff(v))}
            />
          </div>

          {(offsetX !== 0 || offsetY !== 0) && (
            <button
              type="button"
              onClick={() => {
                setOffsetX(0);
                setOffsetY(0);
              }}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <RotateCcw className="size-3" /> Restablecer
            </button>
          )}
        </div>
      )}

      {/* Copias */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Cantidad de copias</Label>
        <Input
          type="number"
          min={1}
          max={50}
          value={copies}
          onChange={(e) =>
            setCopies(Math.max(1, Math.min(50, parseInt(e.target.value || "1"))))
          }
          className="h-11 tabular-nums"
        />
      </div>

      {/* Botón imprimir */}
      <Button
        type="button"
        className={`w-full h-12 ${
          status === "done"
            ? "bg-green-600 hover:bg-green-700 text-white"
            : status === "failed"
              ? "bg-destructive text-destructive-foreground"
              : ""
        }`}
        onClick={printNow}
        disabled={status === "sending" || status === "printing"}
      >
        {status === "sending" || status === "printing" ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {status === "sending" ? "Enviando…" : "Imprimiendo…"}
          </>
        ) : status === "done" ? (
          <>
            <Check className="size-4" />
            Impreso ✓
          </>
        ) : status === "failed" ? (
          <>
            <RotateCcw className="size-4" />
            Reintentar
          </>
        ) : (
          <>
            <Printer className="size-4" />
            Imprimir {copies} {copies === 1 ? "copia" : "copias"}
          </>
        )}
      </Button>
    </div>
  );
}

function OffsetField({
  label,
  value,
  onChange,
  iconMinus,
  iconPlus,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  iconMinus: React.ReactNode;
  iconPlus: React.ReactNode;
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
        >
          {iconPlus}
        </Button>
      </div>
    </div>
  );
}
