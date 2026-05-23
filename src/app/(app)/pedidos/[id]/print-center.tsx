"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Check,
  Loader2,
  Wifi,
  WifiOff,
  ListChecks,
  Layers,
  ArrowRightCircle,
  X,
} from "lucide-react";

type Missing = { id: string; name: string; sku: string };
type PrintKind = "shipping" | "product-labels" | "expiry-labels" | "box-logo";
type ProductionUnit = { id: string; productName: string; batchCode: string };

const OFFSET_STORAGE_KEY = "lilus.productLabelOffset";
const STEP_MM = 0.5;
const MAX_MM = 20;

export function PrintCenter({
  orderId,
  missingLabels,
  packCount,
  agentEnabled,
  productionUnits,
}: {
  orderId: string;
  missingLabels: Missing[];
  packCount: number;
  agentEnabled: boolean;
  productionUnits: ProductionUnit[];
}) {
  const [openedAny, setOpenedAny] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [boxLogoCopies, setBoxLogoCopies] = useState(Math.max(1, packCount));

  // Estado del modo "una a una" para etiquetas 2×1
  const [oneByOneOpen, setOneByOneOpen] = useState(false);
  const [oneByOneIndex, setOneByOneIndex] = useState(0);
  const [oneByOneStatus, setOneByOneStatus] = useState<
    "idle" | "sending" | "printing" | "done" | "failed"
  >("idle");

  // Estado por tipo de impresión: idle | sending | printing | done | failed
  const [printStatus, setPrintStatus] = useState<
    Record<PrintKind, "idle" | "sending" | "printing" | "done" | "failed">
  >({
    shipping: "idle",
    "product-labels": "idle",
    "expiry-labels": "idle",
    "box-logo": "idle",
  });

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

  // ───────── Impresión directa via agente ─────────
  async function printViaAgent(
    kind: PrintKind,
    extras: { copies?: number; offsetX?: number; offsetY?: number } = {}
  ) {
    setPrintStatus((s) => ({ ...s, [kind]: "sending" }));
    try {
      const res = await fetch(`/api/orders/${orderId}/print`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, ...extras }),
      });
      const data = (await res.json()) as { jobId?: string; error?: string };
      if (!res.ok || !data.jobId) {
        throw new Error(data.error ?? "Error encolando trabajo");
      }
      setPrintStatus((s) => ({ ...s, [kind]: "printing" }));
      // Polling estado del trabajo
      await pollJobStatus(data.jobId, kind);
    } catch (e) {
      setPrintStatus((s) => ({ ...s, [kind]: "failed" }));
      toast.error((e as Error).message);
    }
  }

  async function pollJobStatus(jobId: string, kind: PrintKind) {
    const maxAttempts = 30; // 30 * 1s = 30 seg
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      try {
        const res = await fetch(`/api/print-queue/${jobId}/status`);
        if (!res.ok) continue;
        const job = (await res.json()) as {
          status: "PENDING" | "PICKED_UP" | "DONE" | "FAILED";
          error?: string | null;
        };
        if (job.status === "DONE") {
          setPrintStatus((s) => ({ ...s, [kind]: "done" }));
          toast.success("Impreso ✓");
          setTimeout(() => setPrintStatus((s) => ({ ...s, [kind]: "idle" })), 2500);
          return;
        }
        if (job.status === "FAILED") {
          setPrintStatus((s) => ({ ...s, [kind]: "failed" }));
          toast.error(job.error ?? "El agente reportó error");
          return;
        }
      } catch {}
    }
    // Timeout
    setPrintStatus((s) => ({ ...s, [kind]: "failed" }));
    toast.error(
      "No hay respuesta del agente. Verifica que esté corriendo en la PC."
    );
  }

  // ───────── Fallback: abrir PDF en pestaña ─────────
  function openPdf(path: string) {
    setOpenedAny(true);
    window.open(`/api/orders/${orderId}/${path}`, "_blank", "noopener");
  }

  // ───────── Modo "una a una": imprime UNA unidad ─────────
  async function printSingleUnit(unitIndex: number) {
    setOneByOneStatus("sending");
    try {
      if (agentEnabled) {
        // Vía agente
        const res = await fetch(`/api/orders/${orderId}/print`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "expiry-labels", unitIndex }),
        });
        const data = (await res.json()) as { jobId?: string; error?: string };
        if (!res.ok || !data.jobId) {
          throw new Error(data.error ?? "Error encolando trabajo");
        }
        setOneByOneStatus("printing");
        // Polling
        for (let i = 0; i < 30; i++) {
          await new Promise((r) => setTimeout(r, 1000));
          const sres = await fetch(`/api/print-queue/${data.jobId}/status`);
          if (!sres.ok) continue;
          const sjob = (await sres.json()) as {
            status: "PENDING" | "PICKED_UP" | "DONE" | "FAILED";
            error?: string | null;
          };
          if (sjob.status === "DONE") {
            setOneByOneStatus("done");
            return;
          }
          if (sjob.status === "FAILED") {
            setOneByOneStatus("failed");
            toast.error(sjob.error ?? "El agente reportó error");
            return;
          }
        }
        setOneByOneStatus("failed");
        toast.error("Timeout esperando al agente");
      } else {
        // Fallback: abrir PDF en pestaña con solo esa unidad
        window.open(
          `/api/orders/${orderId}/expiry-labels?unitIndex=${unitIndex}`,
          "_blank",
          "noopener"
        );
        setOneByOneStatus("done");
      }
    } catch (e) {
      setOneByOneStatus("failed");
      toast.error((e as Error).message);
    }
  }

  function advanceOneByOne() {
    if (oneByOneIndex + 1 >= productionUnits.length) {
      setOneByOneOpen(false);
      toast.success("Listo, todas las etiquetas impresas");
      return;
    }
    setOneByOneIndex(oneByOneIndex + 1);
    setOneByOneStatus("idle");
  }

  // ───────── Acciones por tipo ─────────
  function handlePrint(kind: PrintKind) {
    if (kind === "shipping") {
      if (agentEnabled) return printViaAgent("shipping");
      return openPdf("shipping-label");
    }
    if (kind === "product-labels") {
      if (agentEnabled)
        return printViaAgent("product-labels", { offsetX, offsetY });
      const params = new URLSearchParams();
      if (offsetX !== 0) params.set("offsetX", String(offsetX));
      if (offsetY !== 0) params.set("offsetY", String(offsetY));
      return openPdf(`product-labels${params.toString() ? `?${params}` : ""}`);
    }
    if (kind === "expiry-labels") {
      if (agentEnabled) return printViaAgent("expiry-labels");
      return openPdf("expiry-labels");
    }
    if (kind === "box-logo") {
      if (agentEnabled)
        return printViaAgent("box-logo", { copies: boxLogoCopies });
      const params = new URLSearchParams();
      params.set("copies", String(boxLogoCopies));
      return openPdf(`box-logo?${params}`);
    }
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
        {/* Estado del agente */}
        <div
          className={`flex items-center gap-2 text-xs p-2 rounded-md border ${
            agentEnabled
              ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900 text-green-800 dark:text-green-300"
              : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300"
          }`}
        >
          {agentEnabled ? (
            <Wifi className="size-4 shrink-0" />
          ) : (
            <WifiOff className="size-4 shrink-0" />
          )}
          <span>
            {agentEnabled
              ? "Impresión directa activa · sale por la MUNBYN"
              : "Agente desactivado · abrirá el PDF para imprimir manualmente"}
          </span>
        </div>

        {/* Etiqueta de envío */}
        <PrintButton
          icon={Printer}
          title="Etiqueta de envío"
          subtitle="4×6 pulgadas · una"
          status={printStatus.shipping}
          primary
          onClick={() => handlePrint("shipping")}
        />

        {/* Logo de caja — solo si hay packs */}
        {packCount > 0 && (
          <div className="rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-3 space-y-3">
            <div className="flex items-start gap-2">
              <Sticker className="size-4 mt-0.5 text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Logo para caja de envío</p>
                <p className="text-[11px] text-muted-foreground">
                  Este pedido lleva {packCount} pack
                  {packCount > 1 ? "s" : ""}. Imprime el sello LILUS para la
                  caja.
                </p>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-[11px] font-medium">Copias</Label>
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
                  className="h-9 mt-1 tabular-nums"
                />
              </div>
              <PrintButton
                icon={Sticker}
                title="Imprimir"
                status={printStatus["box-logo"]}
                compact
                onClick={() => handlePrint("box-logo")}
              />
            </div>
          </div>
        )}

        {/* Etiquetas de producto con ajuste */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="size-4 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Etiquetas de producto</p>
              <p className="text-[11px] text-muted-foreground">
                Una por unidad · PDFs subidos por producto
              </p>
            </div>
          </div>

          {/* Ajuste de offset */}
          <div className="rounded-md bg-background border p-3 space-y-3">
            <div className="flex items-start gap-2">
              <Move className="size-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold leading-tight">
                  Ajustar posición (mm)
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  Si la etiqueta queda descuadrada en la impresora, mueve el
                  diseño antes de imprimir.
                  <br />
                  <strong>X</strong>: + derecha, − izquierda ·{" "}
                  <strong>Y</strong>: + arriba, − abajo
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
                    Ajuste:{" "}
                    <strong className="text-foreground tabular-nums">
                      X {offsetX > 0 ? "+" : ""}
                      {offsetX} · Y {offsetY > 0 ? "+" : ""}
                      {offsetY} mm
                    </strong>
                  </>
                ) : (
                  "Sin ajuste"
                )}
              </span>
              {isAdjusted && (
                <button
                  type="button"
                  onClick={() => {
                    setOffsetX(0);
                    setOffsetY(0);
                  }}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <RotateCcw className="size-3" /> Reset
                </button>
              )}
            </div>
          </div>

          <PrintButton
            icon={FileText}
            title={
              isAdjusted ? "Imprimir con ajuste" : "Imprimir etiquetas"
            }
            status={printStatus["product-labels"]}
            onClick={() => handlePrint("product-labels")}
          />
        </div>

        {/* Etiquetas 2x1 (caducidad) — con dos modos */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="size-4 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                Etiquetas 2×1 (caducidad)
              </p>
              <p className="text-[11px] text-muted-foreground">
                {productionUnits.length} unidad
                {productionUnits.length === 1 ? "" : "es"} · lote + caducidad
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <PrintButton
              icon={Layers}
              title="Todas a la vez"
              status={printStatus["expiry-labels"]}
              compact
              onClick={() => handlePrint("expiry-labels")}
            />
            <Button
              type="button"
              variant="outline"
              className="h-9"
              disabled={productionUnits.length === 0}
              onClick={() => {
                setOneByOneIndex(0);
                setOneByOneStatus("idle");
                setOneByOneOpen(true);
              }}
            >
              <ListChecks className="size-4" />
              Una a una
            </Button>
          </div>
        </div>

        {/* Faltantes */}
        {missingLabels.length > 0 && (
          <Alert>
            <AlertTriangle className="size-4" />
            <AlertTitle>Productos sin PDF de etiqueta</AlertTitle>
            <AlertDescription>
              <ul className="text-xs mt-1 list-disc pl-4">
                {missingLabels.map((m) => (
                  <li key={m.id}>
                    {m.name}{" "}
                    <span className="font-mono">({m.sku})</span>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {openedAny && !agentEnabled && (
          <p className="text-[11px] text-muted-foreground border-t pt-2">
            Los PDFs se abren en nueva pestaña. Si tu navegador los bloquea,
            permite popups para este sitio.
          </p>
        )}
      </CardContent>

      {/* Dialog modo "una a una" */}
      <Dialog
        open={oneByOneOpen}
        onOpenChange={(open) => {
          if (!open) setOneByOneOpen(false);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListChecks className="size-5" />
              Etiquetas 2×1 una a una
            </DialogTitle>
            <DialogDescription>
              Imprime una etiqueta, confirma que salió bien, y pasa a la
              siguiente. Útil cuando se traba el rollo o quieres revisar antes
              de seguir.
            </DialogDescription>
          </DialogHeader>

          {productionUnits.length > 0 && (
            <div className="space-y-3">
              {/* Indicador */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Etiqueta{" "}
                  <strong className="text-foreground tabular-nums">
                    {oneByOneIndex + 1}
                  </strong>{" "}
                  de{" "}
                  <strong className="text-foreground tabular-nums">
                    {productionUnits.length}
                  </strong>
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {Math.round(((oneByOneIndex + 1) / productionUnits.length) * 100)}%
                </span>
              </div>

              {/* Barra de progreso */}
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

              {/* Detalle de la unidad */}
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
              <Button onClick={() => printSingleUnit(oneByOneIndex)}>
                <Printer className="size-4" />
                Imprimir
              </Button>
            )}

            {(oneByOneStatus === "sending" || oneByOneStatus === "printing") && (
              <Button disabled>
                <Loader2 className="size-4 animate-spin" />
                {oneByOneStatus === "sending" ? "Enviando…" : "Imprimiendo…"}
              </Button>
            )}

            {oneByOneStatus === "done" && (
              <Button
                onClick={advanceOneByOne}
                className="bg-green-600 hover:bg-green-700"
              >
                {oneByOneIndex + 1 >= productionUnits.length ? (
                  <>
                    <Check className="size-4" />
                    Terminar
                  </>
                ) : (
                  <>
                    <ArrowRightCircle className="size-4" />
                    Siguiente
                  </>
                )}
              </Button>
            )}

            {oneByOneStatus === "failed" && (
              <Button
                variant="destructive"
                onClick={() => printSingleUnit(oneByOneIndex)}
              >
                <RotateCcw className="size-4" />
                Reintentar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────
// Botón con estado
// ──────────────────────────────────────────────────────────
function PrintButton({
  icon: Icon,
  title,
  subtitle,
  status,
  onClick,
  primary,
  compact,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  status: "idle" | "sending" | "printing" | "done" | "failed";
  onClick: () => void;
  primary?: boolean;
  compact?: boolean;
}) {
  const isBusy = status === "sending" || status === "printing";
  const isDone = status === "done";
  const isFailed = status === "failed";

  let DisplayIcon: React.ComponentType<{ className?: string }> = Icon;
  let statusText: string | null = null;
  if (isBusy) {
    DisplayIcon = Loader2;
    statusText =
      status === "sending" ? "Enviando…" : "Imprimiendo…";
  } else if (isDone) {
    DisplayIcon = Check;
    statusText = "Impreso";
  } else if (isFailed) {
    DisplayIcon = AlertTriangle;
    statusText = "Error";
  }

  return (
    <Button
      type="button"
      variant={primary ? "default" : "outline"}
      className={`${compact ? "h-9" : "w-full justify-start h-auto py-3"} ${
        isDone ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : ""
      } ${isFailed ? "border-destructive text-destructive" : ""}`}
      onClick={onClick}
      disabled={isBusy}
    >
      <DisplayIcon
        className={`size-4 shrink-0 ${isBusy ? "animate-spin" : ""}`}
      />
      {compact ? (
        statusText ?? title
      ) : (
        <span className="flex-1 text-left">
          <span className="block text-sm font-medium">
            {statusText ?? title}
          </span>
          {subtitle && (
            <span className="block text-[11px] font-normal opacity-75">
              {subtitle}
            </span>
          )}
        </span>
      )}
    </Button>
  );
}

// ──────────────────────────────────────────────────────────
// Input de offset
// ──────────────────────────────────────────────────────────
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
