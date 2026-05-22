"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff, RefreshCw, Printer } from "lucide-react";
import { savePrintAgentSettingsAction } from "./actions";

export function PrintAgentSettings({
  initial,
}: {
  initial: { enabled: boolean; token: string; printer: string };
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initial.enabled);
  const [token, setToken] = useState(initial.token);
  const [printer, setPrinter] = useState(initial.printer);
  const [showToken, setShowToken] = useState(false);
  const [isPending, startTransition] = useTransition();

  function generateToken() {
    const arr = new Uint8Array(24);
    crypto.getRandomValues(arr);
    const t = Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
    setToken(t);
    setShowToken(true);
  }

  function save() {
    startTransition(async () => {
      try {
        await savePrintAgentSettingsAction({
          enabled,
          token,
          printer,
        });
        toast.success("Configuración guardada");
        router.refresh();
      } catch {
        toast.error("No se pudo guardar");
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Activa el agente para que los botones de impresión envíen directo a la
        impresora MUNBYN conectada por USB en la PC del 1er piso (en lugar de
        abrir el PDF en una pestaña). El agente debe estar instalado y corriendo
        en esa PC.
      </p>

      <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
        <div className="flex items-center gap-2">
          <Printer className="size-4 text-primary" />
          <Label htmlFor="agent-enabled" className="text-sm font-medium">
            Agente de impresión activo
          </Label>
        </div>
        <Switch
          id="agent-enabled"
          checked={enabled}
          onCheckedChange={setEnabled}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Nombre de la impresora en Windows
        </Label>
        <Input
          value={printer}
          onChange={(e) => setPrinter(e.target.value)}
          placeholder="Munbyn RW403B-N"
          className="h-11"
        />
        <p className="text-[11px] text-muted-foreground">
          Tal cual aparece en <code className="font-mono">Get-Printer</code> en
          PowerShell.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Token compartido</Label>
        <div className="flex gap-2">
          <Input
            type={showToken ? "text" : "password"}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="(no configurado)"
            className="h-11 font-mono text-xs"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0"
            onClick={() => setShowToken((v) => !v)}
            aria-label={showToken ? "Ocultar" : "Mostrar"}
          >
            {showToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0"
            onClick={generateToken}
            aria-label="Generar nuevo"
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Secreto compartido entre LILUS y el agente. Debe coincidir con el
          <code className="font-mono mx-1">LILUS_AGENT_TOKEN</code>
          del archivo <code className="font-mono">.env</code> del agente. Pulsa
          ⟳ para generar uno aleatorio.
        </p>
      </div>

      <Button onClick={save} disabled={isPending} className="w-full sm:w-auto">
        {isPending ? "Guardando…" : "Guardar"}
      </Button>
    </div>
  );
}
