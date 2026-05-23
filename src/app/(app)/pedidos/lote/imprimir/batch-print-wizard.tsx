"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

type PrintKind = "shipping" | "product-labels" | "expiry-labels" | "box-logo";

type OrderSummary = {
  id: string;
  orderNumber: string;
  customerName: string;
  productionUnits: { id: string; productName: string; batchCode: string }[];
  packCount: number;
};

type SubStep = {
  kind: PrintKind;
  title: string;
  paperLabel: string;
  paperWarning: string;
  icon: React.ComponentType<{ className?: string }>;
  hasMultiple: boolean;
  isCircular: boolean;
};

const SUB_STEPS: SubStep[] = [
  {
    kind: "shipping",
    title: "Etiquetas de envío",
    paperLabel: "4×6 pulgadas",
    paperWarning:
      "Carga el rollo de 4×6 pulgadas (10×15 cm) en la MUNBYN antes de imprimir.",
    icon: Truck,
    hasMultiple: true,
    isCircular: false,
  },
  {
    kind: "product-labels",
    title: "Etiquetas de producto",
    paperLabel: "2×2 pulgadas circular",
    paperWarning:
      "Cambia al rollo de stickers circulares 2×2 pulgadas (5.1 cm).",
    icon: Package2,
    hasMultiple: true,
    isCircular: true,
  },
  {
    kind: "expiry-labels",
    title: "Etiquetas de caducidad",
    paperLabel: "2×1 pulgadas",
    paperWarning:
      "Cambia al rollo de etiquetas 2×1 pulgadas (5×2.5 cm).",
    icon: FileText,
    hasMultiple: true,
    isCircular: false,
  },
  {
    kind: "box-logo",
    title: "Logos para caja",
    paperLabel: "2×2 pulgadas circular",
    paperWarning:
      "Usa los stickers circulares 2×2 (mismos que productos).",
    icon: Boxes,
    hasMultiple: true,
    isCircular: true,
  },
];

const OFFSET_STORAGE_KEY = "lilus.productLabelOffset";
const STEP_MM = 0.5;
const MAX_MM = 20;

// Cada item es una etiqueta individual a imprimir (orderId + unitIndex opcional)
type PrintItem = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  unitIndex?: number;
  label: string; // texto descriptivo para mostrar
};

export function BatchPrintWizard({ orderIds }: { orderIds: string[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderSummary[]>([]);

  useEffect(() => {
    async function fetchSummaries() {
      try {
        const ids = orderIds.join(",");
        const res = await fetch(`/api/orders/batch-summary?ids=${ids}`);
        if (!res.ok) throw new Error("Error cargando pedidos");
        const data = (await res.json()) as { orders: OrderSummary[] };
        setOrders(data.orders);
      } catch {
        toast.error("No se pudieron cargar los pedidos seleccionados");
      } finally {
        setLoading(false);
      }
    }
    fetchSummaries();
  }, [orderIds]);

  if (loading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="size-8 animate-spin mx-auto text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          Cargando {orderIds.length} pedido{orderIds.length === 1 ? "" : "s"}…
        </p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed p-12 text-center">
        <p className="text-muted-foreground mb-4">
          No se pudo cargar ningún pedido.
        </p>
        <Button onClick={() => router.push("/pedidos")}>
          <ArrowLeft className="size-4" /> Volver a pedidos
        </Button>
      </div>
    );
  }

  return <BatchPrintCore orders={orders} onFinish={() => router.push("/pedidos")} />;
}

function BatchPrintCore({
  orders,
  onFinish,
}: {
  orders: OrderSummary[];
  onFinish: () => void;
}) {
  // ───── Calcular items por kind para los pedidos seleccionados ─────
  const itemsByKind = useMemo(() => {
    const result: Record<PrintKind, PrintItem[]> = {
      shipping: [],
      "product-labels": [],
      "expiry-labels": [],
      "box-logo": [],
    };
    for (const order of orders) {
      // Shipping: 1 por pedido
      result.shipping.push({
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        label: `${order.orderNumber} · ${order.customerName}`,
      });
      // Productos y caducidad: 1 por unidad de cada pedido
      order.productionUnits.forEach((u, idx) => {
        const labelBase = `${order.orderNumber} · ${u.productName}`;
        result["product-labels"].push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          unitIndex: idx,
          label: labelBase,
        });
        result["expiry-labels"].push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          unitIndex: idx,
          label: `${labelBase} · ${u.batchCode}`,
        });
      });
      // Box logo: 1 por pedido CON packs
      if (order.packCount > 0) {
        result["box-logo"].push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          label: `${order.orderNumber} · ${order.packCount} pack${order.packCount > 1 ? "s" : ""}`,
        });
      }
    }
    return result;
  }, [orders]);

  // ───── Slides (sub-pasos + cambios de papel) ─────
  type Slide =
    | { type: "print"; step: SubStep }
    | { type: "paper-change"; from: SubStep; to: SubStep };

  const slides = useMemo<Slide[]>(() => {
    // Filtrar sub-pasos vacíos (ej: box-logo si ningún pedido tiene packs)
    const activeSteps = SUB_STEPS.filter(
      (s) => itemsByKind[s.kind].length > 0
    );
    const result: Slide[] = [];
    for (let i = 0; i < activeSteps.length; i++) {
      if (i > 0) {
        const prev = activeSteps[i - 1];
        const curr = activeSteps[i];
        if (prev.paperLabel !== curr.paperLabel) {
          result.push({ type: "paper-change", from: prev, to: curr });
        }
      }
      result.push({ type: "print", step: activeSteps[i] });
    }
    return result;
  }, [itemsByKind]);

  const [subIdx, setSubIdx] = useState(0);
  const currentSlide = slides[subIdx];
  const currentStep =
    currentSlide?.type === "print" ? currentSlide.step : null;

  // ───── Offset (compartido para circulares) ─────
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

  // ───── Estado de impresión ─────
  const [statusByKind, setStatusByKind] = useState<
    Record<PrintKind, "idle" | "sending" | "printing" | "done" | "failed">
  >({
    shipping: "idle",
    "product-labels": "idle",
    "expiry-labels": "idle",
    "box-logo": "idle",
  });

  // ───── Dialog "una a una" ─────
  const [oneByOneOpen, setOneByOneOpen] = useState(false);
  const [oneByOneIndex, setOneByOneIndex] = useState(0);
  const [oneByOneStatus, setOneByOneStatus] = useState<
    "idle" | "sending" | "printing" | "done" | "failed"
  >("idle");

  // ───── Acciones API ─────
  async function pollUntilDone(jobId: string): Promise<"DONE" | "FAILED"> {
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const res = await fetch(`/api/print-queue/${jobId}/status`);
      if (!res.ok) continue;
      const job = (await res.json()) as { status: string; error?: string };
      if (job.status === "DONE") return "DONE";
      if (job.status === "FAILED") {
        toast.error(job.error ?? "Error del agente");
        return "FAILED";
      }
    }
    toast.error("Timeout esperando al agente");
    return "FAILED";
  }

  async function enqueueItem(
    kind: PrintKind,
    item: PrintItem
  ): Promise<string | null> {
    const body: {
      kind: PrintKind;
      copies?: number;
      offsetX?: number;
      offsetY?: number;
      unitIndex?: number;
    } = { kind };
    if (kind === "product-labels") {
      if (offsetX !== 0) body.offsetX = offsetX;
      if (offsetY !== 0) body.offsetY = offsetY;
    }
    if (typeof item.unitIndex === "number") body.unitIndex = item.unitIndex;
    // box-logo: copies = packCount del pedido (calculado en el endpoint)

    const res = await fetch(`/api/orders/${item.orderId}/print`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { jobId?: string; error?: string };
    if (!res.ok || !data.jobId) {
      toast.error(data.error ?? "Error encolando");
      return null;
    }
    return data.jobId;
  }

  async function printAllItems() {
    if (!currentStep) return;
    const items = itemsByKind[currentStep.kind];
    if (items.length === 0) return;
    setStatusByKind((s) => ({ ...s, [currentStep.kind]: "sending" }));
    for (let i = 0; i < items.length; i++) {
      const jobId = await enqueueItem(currentStep.kind, items[i]);
      if (!jobId) {
        setStatusByKind((s) => ({ ...s, [currentStep.kind]: "failed" }));
        return;
      }
      setStatusByKind((s) => ({ ...s, [currentStep.kind]: "printing" }));
      const result = await pollUntilDone(jobId);
      if (result === "FAILED") {
        setStatusByKind((s) => ({ ...s, [currentStep.kind]: "failed" }));
        return;
      }
    }
    setStatusByKind((s) => ({ ...s, [currentStep.kind]: "done" }));
    toast.success(`${items.length} etiquetas impresas ✓`);
    setTimeout(
      () => setStatusByKind((s) => ({ ...s, [currentStep.kind]: "idle" })),
      2500
    );
  }

  async function printTest() {
    if (!currentStep) return;
    const items = itemsByKind[currentStep.kind];
    if (items.length === 0) return;
    setStatusByKind((s) => ({ ...s, [currentStep.kind]: "sending" }));
    const jobId = await enqueueItem(currentStep.kind, items[0]);
    if (!jobId) {
      setStatusByKind((s) => ({ ...s, [currentStep.kind]: "failed" }));
      return;
    }
    setStatusByKind((s) => ({ ...s, [currentStep.kind]: "printing" }));
    const result = await pollUntilDone(jobId);
    setStatusByKind((s) => ({
      ...s,
      [currentStep.kind]: result.toLowerCase() as "done" | "failed",
    }));
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

  async function printSingleOneByOne(idx: number) {
    if (!currentStep) return;
    const items = itemsByKind[currentStep.kind];
    const item = items[idx];
    if (!item) return;
    setOneByOneStatus("sending");
    const jobId = await enqueueItem(currentStep.kind, item);
    if (!jobId) {
      setOneByOneStatus("failed");
      return;
    }
    setOneByOneStatus("printing");
    const result = await pollUntilDone(jobId);
    setOneByOneStatus(result.toLowerCase() as "done" | "failed");
  }

  function nextOneByOne() {
    if (!currentStep) return;
    const items = itemsByKind[currentStep.kind];
    if (oneByOneIndex + 1 >= items.length) {
      setOneByOneOpen(false);
      toast.success("Todas las etiquetas impresas");
      return;
    }
    setOneByOneIndex(oneByOneIndex + 1);
    setOneByOneStatus("idle");
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

  if (!currentSlide) {
    return (
      <div className="rounded-lg border p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No hay nada que imprimir en los pedidos seleccionados.
        </p>
      </div>
    );
  }

  // ───── Slide de cambio de papel ─────
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

  // ───── Slide de impresión ─────
  if (!currentStep) return null;
  const items = itemsByKind[currentStep.kind];
  const Icon = currentStep.icon;
  const status = statusByKind[currentStep.kind];
  const currentItem = items[oneByOneIndex];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Icon className="size-5" />
          {currentStep.title}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Paso {subIdx + 1} de {slides.length} ·{" "}
          {items.length} etiqueta{items.length === 1 ? "" : "s"} en este lote
        </p>
      </div>

      <SlideProgress slides={slides} currentIdx={subIdx} />

      {/* Resumen de qué se va a imprimir */}
      <div className="rounded-lg border bg-muted/30 p-3">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Se imprimirá:
        </p>
        <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
          {items.slice(0, 10).map((it, i) => (
            <li key={i} className="font-mono text-foreground/80 truncate">
              · {it.label}
            </li>
          ))}
          {items.length > 10 && (
            <li className="text-muted-foreground italic">
              … y {items.length - 10} más
            </li>
          )}
        </ul>
      </div>

      {/* Offset para circulares */}
      {currentStep.isCircular && currentStep.kind === "product-labels" && (
        <OffsetControls
          offsetX={offsetX}
          offsetY={offsetY}
          onChangeX={(v) => setOffsetX(clampOff(v))}
          onChangeY={(v) => setOffsetY(clampOff(v))}
        />
      )}

      {/* Botones de impresión */}
      <div className="space-y-2">
        <Button
          type="button"
          className="w-full h-12"
          onClick={printAllItems}
          disabled={status === "sending" || status === "printing"}
        >
          {status === "sending" || status === "printing" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Imprimiendo…
            </>
          ) : status === "done" ? (
            <>
              <Check className="size-4" />
              Impresas ✓
            </>
          ) : (
            <>
              <Layers className="size-4" />
              Imprimir todas ({items.length})
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="secondary"
          className="w-full h-12"
          onClick={openOneByOne}
          disabled={items.length === 0}
        >
          <ListChecks className="size-4" />
          Imprimir una a una
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full h-12"
          onClick={printTest}
        >
          <TestTube className="size-4" />
          Imprimir prueba (solo una)
        </Button>
      </div>

      {/* Footer */}
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

      {/* Dialog una a una */}
      <Dialog open={oneByOneOpen} onOpenChange={setOneByOneOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListChecks className="size-5" />
              {currentStep.title} — una a una
            </DialogTitle>
            <DialogDescription>
              Imprime, confirma que salió bien, pasa a la siguiente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Etiqueta{" "}
                <strong className="text-foreground">{oneByOneIndex + 1}</strong>{" "}
                de{" "}
                <strong className="text-foreground">{items.length}</strong>
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${
                    ((oneByOneIndex + (oneByOneStatus === "done" ? 1 : 0)) /
                      items.length) *
                    100
                  }%`,
                }}
              />
            </div>
            <div className="rounded-lg border p-3 bg-card">
              <p className="font-medium leading-tight text-sm">
                {currentItem?.label}
              </p>
            </div>
          </div>

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
              <Button onClick={() => printSingleOneByOne(oneByOneIndex)}>
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
                {oneByOneIndex + 1 >= items.length ? (
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
                onClick={() => printSingleOneByOne(oneByOneIndex)}
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
            i <= currentIdx ? "bg-primary" : "bg-muted"
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
          Asegúrate de que el rollo nuevo esté bien insertado y calibrado.
        </AlertDescription>
      </Alert>

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
          <p className="text-[11px] text-muted-foreground mt-0.5">
            X: + derecha, − izquierda · Y: + arriba, − abajo
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[11px] font-medium">X</Label>
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
          <Label className="text-[11px] font-medium">Y</Label>
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
          <RotateCcw className="size-3" /> Restablecer
        </button>
      )}
    </div>
  );
}
