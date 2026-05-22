"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "lilus.installPromptDismissed";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED_KEY) === "1") {
        setDismissed(true);
      }
    } catch {}

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferred || dismissed) return null;

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      setDeferred(null);
    }
  }

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {}
  }

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-80 z-50">
      <div className="rounded-xl border bg-card shadow-xl p-4 flex items-start gap-3">
        <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Download className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Instalar LILUS</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Agrégalo a tu pantalla de inicio para abrirlo como app.
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={install} className="h-8">
              Instalar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={dismiss}
              className="h-8"
            >
              Ahora no
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
