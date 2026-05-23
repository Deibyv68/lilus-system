"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Printer,
  Truck,
  FileText,
  Sticker,
  Layers,
  ListChecks,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Check,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Wifi,
  WifiOff,
  Move,
  X,
  TestTube,
  Package2,
  Boxes,
} from "lucide-react";

// ───────────────── Tipos ─────────────────
type PrintKind = "shipping" | "product-labels" | "expiry-labels" | "box-logo";

type ProductionUnit = {
  id: string;
  productName: string;
  batchCode: string;
};

type SubStep = {
  kind: PrintKind;
  title: string;
  shortTitle: string;
  paperLabel: string;
  paperWarning: string;
  icon: React.ComponentType<{ className?: string }>;
  // ¿Esta sub-paso tiene múltiples unidades (soporta "una a una") ?
  hasMultiple: boolean;
  // ¿Es un sticker circular (mostrar preview circular con offset) ?
  isCircular: boolean;
  // Solo se muestra si hay packs en el pedido
  packsOnly?: boolean;
};

const SUB_STEPS: SubStep[] = [
  {
    kind: "shipping",
    title: "Etiqueta de envío",
    shortTitle: "Envío",
    paperLabel: "4×6 pulgadas",
    paperWarning:
      "Carga el rollo de 4×6 pulgadas (10×15 cm) en la MUNBYN antes de imprimir.",
    icon: Truck,
    hasMultiple: false,
    isCircular: false,
  },
  {
    kind: "product-labels",
    title: "Etiquetas de producto",
    shortTitle: "Productos",
    paperLabel: "2×2 pulgadas circular",
    paperWarning:
      "Cambia al rollo de stickers circulares 2×2 pulgadas (5.1 cm) en la MUNBYN.",
    icon: Package2,
    hasMultiple: true,
    isCircular: true,
  },
  {
    kind: "expiry-labels",
    title: "Etiquetas de caducidad",
    shortTitle: "Caducidad",
    paperLabel: "2×1 pulgadas",
    paperWarning:
      "Cambia al rollo de etiquetas 2×1 pulgadas (5×2.5 cm) en la MUNBYN.",
    icon: FileText,
    hasMultiple: true,
    isCircular: false,
  },
  {
    kind: "box-logo",
    title: "Logo para caja",
    shortTitle: "Caja",
    paperLabel: "2×2 pulgadas circular",
    paperWarning:
      "Usa los stickers circulares 2×2 (mismos que productos) para sellar la caja.",
    icon: Boxes,
    hasMultiple: false,
    isCircular: true,
    packsOnly: true,
  },
];

const OFFSET_STORAGE_KEY = "lilus.productLabelOffset";
const STEP_MM = 0.5;
const MAX_MM = 20;

// ─────────────────────────────────────────────────────────────
export function PrintStepWizard({
  orderId,
  orderNumber,
  productionUnits,
  packCount,
  agentEnabled,
  onFinish,
}: {
  orderId: string;
  orderNumber: string;
  productionUnits: ProductionUnit[];
  packCount: number;
  agentEnabled: boolean;
  onFinish: () => void;
}) {
  // Filtrar sub-pasos según el pedido (logo de caja solo si hay packs)
  const visibleSteps = useMemo(
    () => SUB_STEPS.filter((s) => (s.packsOnly ? packCount > 0 : true)),
    [packCount]
  );

  const [subIdx, setSubIdx] = useState(0);
  const current = visibleSteps[subIdx];

  // Estado del agente (polling cada 3s)
  const [agentOnline, setAgentOnline] = useState(false);
  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch("/api/agent/status");
        if (res.ok && !cancelled) {
          const data = (await res.json()) as { online: boolean };
          setAgentOnline(data.online);
        }
      } catch {}
    }
    check();
    const t = setInterval(check, 3000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  // Offset para circulares (compartido por product-labels y box-logo)
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
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

  // Estado de impresión por kind
  const [statusByKind, setStatusByKind] = useState<
    Record<PrintKind, "idle" | "sending" | "printing" | "done" | "failed">
  >({
    shipping: "idle",
    "product-labels": "idle",
    "expiry-labels": "idle",
    "box-logo": "idle",
  });

  // Dialog "una a una"
  const [oneByOneOpen, setOneByOneOpen] = useState(false);
  const [oneByOneIndex, setOneByOneIndex] = useState(0);
  const [oneByOneStatus, setOneByOneStatus] = useState<
    "idle" | "sending" | "printing" | "done" | "failed"
  >("idle");

  // Copies para box-logo
  const [boxLogoCopies, setBoxLogoCopies] = useState(Math.max(1, packCount));

  // ───────── Acciones ─────────
  async function pollUntilDone(jobId: string): Promise<"DONE" | "FAILED"> {
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const res = await fetch(`/api/print-queue/${jobId}/status`);
      if (!res.ok) continue;
      const job = (await res.json()) as { status: string; error?: string };
      if (job.status === "DONE") return "DONE";
      if (job.status === "FAILED") {
        toast.error(job.error ?? "El agente reportó error");
        return "FAILED";
      }
    }
    toast.error("Timeout esperando al agente");
    return "FAILED";
  }

  async function enqueue(
    kind: PrintKind,
    body: { copies?: number; offsetX?: number; offsetY?: number; unitIndex?: number } = {}
  ): Promise<string | null> {
    const res = await fetch(`/api/orders/${orderId}/print`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, ...body }),
    });
    const data = (await res.json()) as { jobId?: string; error?: string };
    if (!res.ok || !data.jobId) {
      toast.error(data.error ?? "Error encolando trabajo");
      return null;
    }
    return data.jobId;
  }

  function buildExtras(kind: PrintKind): {
    offsetX?: number;
    offsetY?: number;
    copies?: number;
    unitIndex?: number;
  } {
    const extras: {
      offsetX?: number;
      offsetY?: number;
      copies?: number;
      unitIndex?: number;
    } = {};
    if (kind === "product-labels") {
      if (offsetX !== 0) extras.offsetX = offsetX;
      if (offsetY !== 0) extras.offsetY = offsetY;
    }
    if (kind === "box-logo") {
      extras.copies = boxLogoCopies;
    }
    return extras;
  }

  async function printAll() {
    if (!current) return;
    if (!agentEnabled) {
      // Fallback: abrir PDF
      openPdf(current.kind);
      return;
    }
    setStatusByKind((s) => ({ ...s, [current.kind]: "sending" }));
    const jobId = await enqueue(current.kind, buildExtras(current.kind));
    if (!jobId) {
      setStatusByKind((s) => ({ ...s, [current.kind]: "failed" }));
      return;
    }
    setStatusByKind((s) => ({ ...s, [current.kind]: "printing" }));
    const result = await pollUntilDone(jobId);
    setStatusByKind((s) => ({ ...s, [current.kind]: result.toLowerCase() as "done" | "failed" }));
    if (result === "DONE") {
      toast.success("Impreso ✓");
      setTimeout(
        () => setStatusByKind((s) => ({ ...s, [current.kind]: "idle" })),
        2500
      );
    }
  }

  async function printTest() {
    if (!current) return;
    if (!agentEnabled) {
      openPdf(current.kind, true);
      return;
    }
    setStatusByKind((s) => ({ ...s, [current.kind]: "sending" }));
    const extras = buildExtras(current.kind);
    if (current.hasMultiple) {
      extras.unitIndex = 0; // Solo la primera unidad
    }
    if (current.kind === "box-logo") {
      extras.copies = 1; // Solo 1 copia
    }
    const jobId = await enqueue(current.kind, extras);
    if (!jobId) {
      setStatusByKind((s) => ({ ...s, [current.kind]: "failed" }));
      return;
    }
    setStatusByKind((s) => ({ ...s, [current.kind]: "printing" }));
    const result = await pollUntilDone(jobId);
    setStatusByKind((s) => ({ ...s, [current.kind]: result.toLowerCase() as "done" | "failed" }));
    if (result === "DONE") {
      toast.success("Prueba impresa ✓");
      setTimeout(
        () => setStatusByKind((s) => ({ ...s, [current.kind]: "idle" })),
        2500
      );
    }
  }

  function openOneByOne() {
    setOneByOneIndex(0);
    setOneByOneStatus("idle");
    setOneByOneOpen(true);
  }

  async function printSingle(idx: number) {
    if (!current) return;
    setOneByOneStatus("sending");
    if (!agentEnabled) {
      openPdf(current.kind, true, idx);
      setOneByOneStatus("done");
      return;
    }
    const extras = { ...buildExtras(current.kind), unitIndex: idx };
    const jobId = await enqueue(current.kind, extras);
    if (!jobId) {
      setOneByOneStatus("failed");
      return;
    }
    setOneByOneStatus("printing");
    const result = await pollUntilDone(jobId);
    setOneByOneStatus(result.toLowerCase() as "done" | "failed");
  }

  function nextOneByOne() {
    if (oneByOneIndex + 1 >= productionUnits.length) {
      setOneByOneOpen(false);
      toast.success("Todas las etiquetas impresas");
      return;
    }
    setOneByOneIndex(oneByOneIndex + 1);
    setOneByOneStatus("idle");
  }

  function openPdf(kind: PrintKind, isTest = false, unitIdx?: number) {
    const params = new URLSearchParams();
    if (kind === "product-labels") {
      if (offsetX !== 0) params.set("offsetX", String(offsetX));
      if (offsetY !== 0) params.set("offsetY", String(offsetY));
    }
    if (kind === "box-logo") {
      params.set("copies", String(isTest ? 1 : boxLogoCopies));
    }
    if (isTest && SUB_STEPS.find((s) => s.kind === kind)?.hasMultiple) {
      params.set("unitIndex", "0");
    }
    if (typeof unitIdx === "number") {
      params.set("unitIndex", String(unitIdx));
    }
    const endpoint =
      kind === "shipping"
        ? "shipping-label"
        : kind === "product-labels"
          ? "product-labels"
          : kind === "expiry-labels"
            ? "expiry-labels"
            : "box-logo";
    const qs = params.toString();
    window.open(
      `/api/orders/${orderId}/${endpoint}${qs ? `?${qs}` : ""}`,
      "_blank",
      "noopener"
    );
  }

  function goPrev() {
    if (subIdx === 0) return;
    setSubIdx(subIdx - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function goNext() {
    if (subIdx + 1 >= visibleSteps.length) {
      onFinish();
      return;
    }
    setSubIdx(subIdx + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!current) return null;
  const Icon = current.icon;
  const status = statusByKind[current.kind];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Icon className="size-5" />
          {current.title}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Paso {subIdx + 1} de {visibleSteps.length} · Pedido {orderNumber}
        </p>
      </div>

      {/* Indicador de progreso del sub-wizard */}
      <div className="flex items-center gap-1">
        {visibleSteps.map((s, i) => (
          <div
            key={s.kind}
            className={`h-1.5 rounded-full flex-1 transition-colors ${
              i < subIdx
                ? "bg-primary"
                : i === subIdx
                  ? "bg-primary"
                  : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Estado del agente */}
      <AgentStatusIndicator online={agentOnline} enabled={agentEnabled} />

      {/* Aviso de cambio de papel */}
      <Alert>
        <AlertTriangle className="size-4" />
        <AlertTitle>Antes de imprimir</AlertTitle>
        <AlertDescription className="text-xs">
          {current.paperWarning}
        </AlertDescription>
      </Alert>

      {/* Preview */}
      <LabelPreview
        step={current}
        offsetX={offsetX}
        offsetY={offsetY}
        productionUnits={productionUnits}
        packCount={packCount}
        boxLogoCopies={boxLogoCopies}
      />

      {/* Offset solo para circulares */}
      {current.isCircular && current.kind === "product-labels" && (
        <OffsetControls
          offsetX={offsetX}
          offsetY={offsetY}
          onChangeX={(v) => setOffsetX(clampOff(v))}
          onChangeY={(v) => setOffsetY(clampOff(v))}
        />
      )}

      {/* Copies para box-logo */}
      {current.kind === "box-logo" && (
        <div className="rounded-lg border p-3 space-y-2">
          <Label className="text-sm font-medium">Cantidad de copias</Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={boxLogoCopies}
            onChange={(e) =>
              setBoxLogoCopies(
                Math.max(1, Math.min(20, parseInt(e.target.value || "1")))
              )
            }
            className="h-11 tabular-nums"
          />
          <p className="text-[11px] text-muted-foreground">
            Por defecto se imprime una por cada pack del pedido.
          </p>
        </div>
      )}

      {/* Botones de impresión */}
      <div className="space-y-2">
        <PrintActionButton
          icon={Layers}
          title={
            current.hasMultiple
              ? `Imprimir todas (${productionUnits.length})`
              : "Imprimir"
          }
          status={status}
          onClick={printAll}
          primary
        />

        {current.hasMultiple && (
          <PrintActionButton
            icon={ListChecks}
            title="Imprimir una a una"
            status="idle"
            onClick={openOneByOne}
          />
        )}

        <PrintActionButton
          icon={TestTube}
          title="Imprimir prueba (solo una)"
          status="idle"
          onClick={printTest}
          variant="outline"
        />
      </div>

      {/* Footer: Atrás / Siguiente */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={goPrev}
          disabled={subIdx === 0}
          className="h-12"
        >
          <ArrowLeft className="size-4" />
          Atrás
        </Button>

        <Button type="button" onClick={goNext} className="h-12 flex-1">
          {subIdx + 1 >= visibleSteps.length ? (
            <>
              <Check className="size-4" />
              Finalizar
            </>
          ) : (
            <>
              Siguiente
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </div>

      {/* Dialog modo una a una */}
      <Dialog open={oneByOneOpen} onOpenChange={setOneByOneOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListChecks className="size-5" />
              {current.title} — una a una
            </DialogTitle>
            <DialogDescription>
              Imprime, confirma que salió bien, y pasa a la siguiente.
            </DialogDescription>
          </DialogHeader>

          {productionUnits.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Etiqueta{" "}
                  <strong className="text-foreground">
                    {oneByOneIndex + 1}
                  </strong>{" "}
                  de{" "}
                  <strong className="text-foreground">
                    {productionUnits.length}
                  </strong>
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${
                      ((oneByOneIndex + (oneByOneStatus === "done" ? 1 : 0)) /
                        productionUnits.length) *
                      100
                    }%`,
                  }}
                />
              </div>
              <div className="rounded-lg border p-3 bg-card">
                <p className="font-medium leading-tight">
                  {productionUnits[oneByOneIndex]?.productName}
                </p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  Lote: {productionUnits[oneByOneIndex]?.batchCode}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setOneByOneOpen(false)}
              disabled={
                oneByOneStatus === "sending" || oneByOneStatus === "printing"
              }
            >
              <X className="size-4" />
              Cerrar
            </Button>

            {oneByOneStatus === "idle" && (
              <Button onClick={() => printSingle(oneByOneIndex)}>
                <Printer className="size-4" />
                Imprimir
              </Button>
            )}

            {(oneByOneStatus === "sending" ||
              oneByOneStatus === "printing") && (
              <Button disabled>
                <Loader2 className="size-4 animate-spin" />
                {oneByOneStatus === "sending" ? "Enviando…" : "Imprimiendo…"}
              </Button>
            )}

            {oneByOneStatus === "done" && (
              <Button
                onClick={nextOneByOne}
                className="bg-green-600 hover:bg-green-700"
              >
                {oneByOneIndex + 1 >= productionUnits.length ? (
                  <>
                    <Check className="size-4" />
                    Terminar
                  </>
                ) : (
                  <>
                    <ArrowRight className="size-4" />
                    Siguiente
                  </>
                )}
              </Button>
            )}

            {oneByOneStatus === "failed" && (
              <Button
                variant="destructive"
                onClick={() => printSingle(oneByOneIndex)}
              >
                <RotateCcw className="size-4" />
                Reintentar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ───────────────── Sub-componentes ─────────────────

function AgentStatusIndicator({
  online,
  enabled,
}: {
  online: boolean;
  enabled: boolean;
}) {
  if (!enabled) {
    return (
      <div className="flex items-center gap-2 text-xs p-2.5 rounded-lg border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300">
        <WifiOff className="size-4 shrink-0" />
        <span>
          Agente desactivado · se abrirá el PDF para imprimir manualmente
        </span>
      </div>
    );
  }
  return (
    <div
      className={`flex items-center gap-2 text-xs p-2.5 rounded-lg border ${
        online
          ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900 text-green-800 dark:text-green-300"
          : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-800 dark:text-red-300"
      }`}
    >
      {online ? (
        <Wifi className="size-4 shrink-0" />
      ) : (
        <WifiOff className="size-4 shrink-0" />
      )}
      <span>
        {online
          ? "Conectado a la impresora · listo para imprimir"
          : "Sin conexión al agente · verifica que la PC del 1er piso esté prendida"}
      </span>
    </div>
  );
}

function LabelPreview({
  step,
  offsetX,
  offsetY,
  productionUnits,
  packCount,
  boxLogoCopies,
}: {
  step: SubStep;
  offsetX: number;
  offsetY: number;
  productionUnits: ProductionUnit[];
  packCount: number;
  boxLogoCopies: number;
}) {
  if (step.isCircular) {
    return (
      <CircularPreview offsetX={offsetX} offsetY={offsetY} kind={step.kind} />
    );
  }
  if (step.kind === "shipping") {
    return <ShippingPreview />;
  }
  if (step.kind === "expiry-labels") {
    return <ExpiryPreview unit={productionUnits[0]} />;
  }
  return null;
}

function CircularPreview({
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
  const dy = -offsetY * PX_PER_MM; // Y+ en PDF es hacia arriba pero en pantalla es hacia abajo

  return (
    <div className="rounded-lg border p-4 bg-muted/30">
      <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
        <Move className="size-3" />
        Vista previa · {kind === "box-logo" ? "Logo de caja" : "Etiqueta circular"}
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

          {/* "Círculo" del diseño (representando el contenido de la etiqueta) */}
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

function ShippingPreview() {
  return (
    <div className="rounded-lg border p-4 bg-muted/30">
      <p className="text-xs font-medium text-muted-foreground mb-3">
        Vista previa · Etiqueta 4×6"
      </p>
      <div className="rounded-lg bg-white dark:bg-zinc-900 border p-3 text-xs space-y-2 aspect-[4/6] max-w-[200px] mx-auto">
        <div className="font-black text-base">LILUS</div>
        <div className="border-t pt-2">
          <p className="text-[9px] text-muted-foreground uppercase">Destinatario</p>
          <p className="font-bold">Nombre del cliente</p>
          <p className="text-[10px]">Dirección de envío</p>
          <p className="text-[10px]">Ciudad, Provincia</p>
        </div>
        <div className="mt-auto border-t pt-2">
          <div className="h-6 bg-zinc-900 dark:bg-zinc-100" />
          <p className="text-center text-[8px] mt-1 font-mono">
            LILUS-000000
          </p>
        </div>
      </div>
    </div>
  );
}

function ExpiryPreview({ unit }: { unit?: ProductionUnit }) {
  return (
    <div className="rounded-lg border p-4 bg-muted/30">
      <p className="text-xs font-medium text-muted-foreground mb-3">
        Vista previa · Etiqueta 2×1"
      </p>
      <div className="rounded bg-white dark:bg-zinc-900 border p-2 text-[10px] aspect-[2/1] max-w-[220px] mx-auto">
        <p className="font-bold leading-tight">
          {unit?.productName ?? "Producto"}
        </p>
        <p className="text-muted-foreground font-mono text-[8px] mt-0.5">
          {unit?.batchCode ?? "L20260101-001"}
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

function OffsetControls({
  offsetX,
  offsetY,
  onChangeX,
  onChangeY,
}: {
  offsetX: number;
  offsetY: number;
  onChangeX: (v: number) => void;
  onChangeY: (v: number) => void;
}) {
  const isAdjusted = offsetX !== 0 || offsetY !== 0;
  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-start gap-2">
        <Move className="size-4 mt-0.5 text-muted-foreground shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium leading-tight">
            Ajustar posición (mm)
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
            X: + derecha, − izquierda · Y: + arriba, − abajo. Mira el preview
            para ver cómo queda.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[11px] font-medium">X (horizontal)</Label>
          <div className="flex items-center gap-1 mt-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8 shrink-0"
              onClick={() => onChangeX(offsetX - STEP_MM)}
            >
              <ArrowLeft className="size-3.5" />
            </Button>
            <Input
              type="number"
              step={STEP_MM}
              value={offsetX}
              onChange={(e) => onChangeX(parseFloat(e.target.value || "0"))}
              className="h-8 text-center tabular-nums px-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8 shrink-0"
              onClick={() => onChangeX(offsetX + STEP_MM)}
            >
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>
        <div>
          <Label className="text-[11px] font-medium">Y (vertical)</Label>
          <div className="flex items-center gap-1 mt-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8 shrink-0"
              onClick={() => onChangeY(offsetY - STEP_MM)}
            >
              <ArrowDown className="size-3.5" />
            </Button>
            <Input
              type="number"
              step={STEP_MM}
              value={offsetY}
              onChange={(e) => onChangeY(parseFloat(e.target.value || "0"))}
              className="h-8 text-center tabular-nums px-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8 shrink-0"
              onClick={() => onChangeY(offsetY + STEP_MM)}
            >
              <ArrowUp className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {isAdjusted && (
        <button
          type="button"
          onClick={() => {
            onChangeX(0);
            onChangeY(0);
          }}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <RotateCcw className="size-3" /> Restablecer a 0,0
        </button>
      )}
    </div>
  );
}

function PrintActionButton({
  icon: Icon,
  title,
  status,
  onClick,
  primary,
  variant,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  status: "idle" | "sending" | "printing" | "done" | "failed";
  onClick: () => void;
  primary?: boolean;
  variant?: "outline";
}) {
  const isBusy = status === "sending" || status === "printing";
  const isDone = status === "done";
  const isFailed = status === "failed";

  let DisplayIcon = Icon;
  let label = title;
  if (isBusy) {
    DisplayIcon = Loader2;
    label = status === "sending" ? "Enviando…" : "Imprimiendo…";
  } else if (isDone) {
    DisplayIcon = Check;
    label = "Impreso";
  } else if (isFailed) {
    DisplayIcon = AlertTriangle;
    label = "Reintentar";
  }

  return (
    <Button
      type="button"
      variant={primary ? "default" : variant ?? "secondary"}
      className={`w-full h-12 justify-start ${
        isDone
          ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
          : ""
      } ${isFailed ? "border-destructive text-destructive" : ""}`}
      onClick={onClick}
      disabled={isBusy}
    >
      <DisplayIcon className={`size-4 ${isBusy ? "animate-spin" : ""}`} />
      {label}
    </Button>
  );
}
