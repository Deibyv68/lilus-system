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
  Move,
  X,
  TestTube,
  Package2,
  Boxes,
  RefreshCw,
} from "lucide-react";
import {
  CircularPreview,
  ShippingPreview,
  ExpiryPreview,
} from "@/components/label-previews";

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
  // Construir lista de slides: cada paso de impresión, intercalado con un
  // slide de "cambio de papel" si el papel difiere del paso anterior.
  type Slide =
    | { type: "print"; step: SubStep }
    | { type: "paper-change"; from: SubStep; to: SubStep };

  const slides = useMemo<Slide[]>(() => {
    const printSteps = SUB_STEPS.filter((s) =>
      s.packsOnly ? packCount > 0 : true
    );
    const result: Slide[] = [];
    for (let i = 0; i < printSteps.length; i++) {
      if (i > 0) {
        const prev = printSteps[i - 1];
        const curr = printSteps[i];
        if (prev.paperLabel !== curr.paperLabel) {
          result.push({ type: "paper-change", from: prev, to: curr });
        }
      }
      result.push({ type: "print", step: printSteps[i] });
    }
    return result;
  }, [packCount]);

  const [subIdx, setSubIdx] = useState(0);
  const currentSlide = slides[subIdx];
  const currentStep =
    currentSlide?.type === "print" ? currentSlide.step : null;

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
    if (!currentStep) return;
    if (!agentEnabled) {
      // Fallback: abrir PDF
      openPdf(currentStep.kind);
      return;
    }
    setStatusByKind((s) => ({ ...s, [currentStep.kind]: "sending" }));
    const jobId = await enqueue(currentStep.kind, buildExtras(currentStep.kind));
    if (!jobId) {
      setStatusByKind((s) => ({ ...s, [currentStep.kind]: "failed" }));
      return;
    }
    setStatusByKind((s) => ({ ...s, [currentStep.kind]: "printing" }));
    const result = await pollUntilDone(jobId);
    setStatusByKind((s) => ({ ...s, [currentStep.kind]: result.toLowerCase() as "done" | "failed" }));
    if (result === "DONE") {
      toast.success("Impreso ✓");
      setTimeout(
        () => setStatusByKind((s) => ({ ...s, [currentStep.kind]: "idle" })),
        2500
      );
    }
  }

  async function printTest() {
    if (!currentStep) return;
    if (!agentEnabled) {
      openPdf(currentStep.kind, true);
      return;
    }
    setStatusByKind((s) => ({ ...s, [currentStep.kind]: "sending" }));
    const extras = buildExtras(currentStep.kind);
    if (currentStep.hasMultiple) {
      extras.unitIndex = 0; // Solo la primera unidad
    }
    if (currentStep.kind === "box-logo") {
      extras.copies = 1; // Solo 1 copia
    }
    const jobId = await enqueue(currentStep.kind, extras);
    if (!jobId) {
      setStatusByKind((s) => ({ ...s, [currentStep.kind]: "failed" }));
      return;
    }
    setStatusByKind((s) => ({ ...s, [currentStep.kind]: "printing" }));
    const result = await pollUntilDone(jobId);
    setStatusByKind((s) => ({ ...s, [currentStep.kind]: result.toLowerCase() as "done" | "failed" }));
    if (result === "DONE") {
      toast.success("Prueba impresa ✓");
      setTimeout(
        () => setStatusByKind((s) => ({ ...s, [currentStep.kind]: "idle" })),
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
    if (!currentStep) return;
    setOneByOneStatus("sending");
    if (!agentEnabled) {
      openPdf(currentStep.kind, true, idx);
      setOneByOneStatus("done");
      return;
    }
    const extras = { ...buildExtras(currentStep.kind), unitIndex: idx };
    const jobId = await enqueue(currentStep.kind, extras);
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
    if (subIdx + 1 >= slides.length) {
      onFinish();
      return;
    }
    setSubIdx(subIdx + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!currentSlide) return null;

  // Slide intermedio: cambio de papel en la impresora
  if (currentSlide.type === "paper-change") {
    return (
      <PaperChangeSlide
        from={currentSlide.from}
        to={currentSlide.to}
        slides={slides}
        currentIdx={subIdx}
        onPrev={goPrev}
        onNext={goNext}
      />
    );
  }

  if (!currentStep) return null;
  const Icon = currentStep.icon;
  const status = statusByKind[currentStep.kind];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Icon className="size-5" />
          {currentStep.title}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Paso {subIdx + 1} de {slides.length} · Pedido {orderNumber}
        </p>
      </div>

      {/* Indicador de progreso del sub-wizard */}
      <SlideProgress slides={slides} currentIdx={subIdx} />

      {/* Preview */}
      <LabelPreview
        step={currentStep}
        offsetX={offsetX}
        offsetY={offsetY}
        productionUnits={productionUnits}
        packCount={packCount}
        boxLogoCopies={boxLogoCopies}
      />

      {/* Offset solo para circulares */}
      {currentStep.isCircular && currentStep.kind === "product-labels" && (
        <OffsetControls
          offsetX={offsetX}
          offsetY={offsetY}
          onChangeX={(v) => setOffsetX(clampOff(v))}
          onChangeY={(v) => setOffsetY(clampOff(v))}
        />
      )}

      {/* Copies para box-logo */}
      {currentStep.kind === "box-logo" && (
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
            currentStep.hasMultiple
              ? `Imprimir todas (${productionUnits.length})`
              : "Imprimir"
          }
          status={status}
          onClick={printAll}
          primary
        />

        {currentStep.hasMultiple && (
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
          {subIdx + 1 >= slides.length ? (
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
              {currentStep.title} — una a una
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

type Slide =
  | { type: "print"; step: SubStep }
  | { type: "paper-change"; from: SubStep; to: SubStep };

function SlideProgress({
  slides,
  currentIdx,
}: {
  slides: Slide[];
  currentIdx: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {slides.map((s, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full flex-1 transition-colors ${
            i < currentIdx
              ? "bg-primary"
              : i === currentIdx
                ? "bg-primary"
                : "bg-muted"
          } ${s.type === "paper-change" ? "opacity-50" : ""}`}
        />
      ))}
    </div>
  );
}

function PaperChangeSlide({
  from,
  to,
  slides,
  currentIdx,
  onPrev,
  onNext,
}: {
  from: SubStep;
  to: SubStep;
  slides: Slide[];
  currentIdx: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const FromIcon = from.icon;
  const ToIcon = to.icon;
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <RefreshCw className="size-5 text-amber-600" />
          Cambia el papel
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Paso {currentIdx + 1} de {slides.length}
        </p>
      </div>

      <SlideProgress slides={slides} currentIdx={currentIdx} />

      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-6 space-y-5">
        <div className="flex items-center justify-center gap-3">
          <div className="flex flex-col items-center gap-2 opacity-50 grayscale">
            <div className="size-14 rounded-full border-2 border-foreground/40 flex items-center justify-center">
              <FromIcon className="size-6" />
            </div>
            <span className="text-[11px] font-medium leading-tight text-center max-w-[100px]">
              {from.paperLabel}
            </span>
            <span className="text-[10px] text-muted-foreground">Quita</span>
          </div>
          <ArrowRight className="size-6 text-amber-600 shrink-0" />
          <div className="flex flex-col items-center gap-2">
            <div className="size-14 rounded-full border-2 border-amber-600 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <ToIcon className="size-6" />
            </div>
            <span className="text-[11px] font-bold leading-tight text-center max-w-[100px]">
              {to.paperLabel}
            </span>
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
              Pon
            </span>
          </div>
        </div>

        <div className="text-center space-y-1.5">
          <p className="text-sm font-semibold">
            Cambia el rollo en la MUNBYN
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {to.paperWarning}
          </p>
        </div>
      </div>

      <Alert>
        <AlertTriangle className="size-4" />
        <AlertTitle>Verifica antes de seguir</AlertTitle>
        <AlertDescription className="text-xs">
          Asegúrate de que el rollo nuevo esté bien insertado y el sensor de la
          impresora lo haya calibrado (luz indicadora fija, sin parpadeos).
        </AlertDescription>
      </Alert>

      {/* Footer: Atrás / Listo */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          className="h-12"
        >
          <ArrowLeft className="size-4" />
          Atrás
        </Button>
        <Button type="button" onClick={onNext} className="h-12 flex-1">
          <Check className="size-4" />
          Listo, ya cambié el papel
        </Button>
      </div>
    </div>
  );
}

function LabelPreview({
  step,
  offsetX,
  offsetY,
  productionUnits,
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
    return (
      <ExpiryPreview
        productName={productionUnits[0]?.productName}
        batchCode={productionUnits[0]?.batchCode}
      />
    );
  }
  return null;
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
