"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { KeyRound, RefreshCw } from "lucide-react";
import { loginWithPin, forgetDeviceAction } from "../actions";

export function PinForm({
  userName,
  isLocked,
  lockedUntil,
}: {
  userName: string;
  isLocked: boolean;
  lockedUntil: string | null;
}) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [isPending, startTransition] = useTransition();

  async function onSubmit() {
    if (pin.length !== 4) {
      toast.error("Ingresa 4 dígitos");
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set("pin", pin);
      const res = await loginWithPin(fd);
      if (res && !res.ok) {
        toast.error(res.error);
        setPin("");
      }
    });
  }

  function forgetDevice() {
    startTransition(async () => {
      await forgetDeviceAction();
      router.refresh();
    });
  }

  const lockedMinutes = lockedUntil
    ? Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 60000)
    : 0;

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="text-center space-y-1">
          <p className="text-sm text-muted-foreground">Hola,</p>
          <p className="text-lg font-bold">{userName}</p>
          <p className="text-xs text-muted-foreground">
            Ingresa tu PIN de 4 dígitos
          </p>
        </div>

        {isLocked && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 text-amber-800 dark:text-amber-300 p-3 text-xs">
            PIN bloqueado por demasiados intentos. Espera{" "}
            <strong>{lockedMinutes} min</strong> o usa tu contraseña.
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="sr-only">PIN</Label>
          <Input
            type="tel"
            inputMode="numeric"
            autoFocus
            pattern="[0-9]{4}"
            maxLength={4}
            value={pin}
            disabled={isLocked || isPending}
            onChange={(e) =>
              setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder="••••"
            className="h-16 text-center text-3xl tracking-[0.5em] tabular-nums"
          />
        </div>

        <Button
          type="button"
          className="w-full h-12"
          onClick={onSubmit}
          disabled={isLocked || isPending || pin.length !== 4}
        >
          {isPending ? (
            "Verificando…"
          ) : (
            <>
              <KeyRound className="size-4" /> Entrar
            </>
          )}
        </Button>

        <div className="text-center pt-2 border-t">
          <button
            type="button"
            onClick={forgetDevice}
            disabled={isPending}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <RefreshCw className="size-3" />
            Olvidé el PIN · entrar con usuario y contraseña
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
