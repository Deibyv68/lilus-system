"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { loginWithPassword } from "./actions";

export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);
  const [pin, setPin] = useState("");

  async function onSubmit(fd: FormData) {
    fd.set("trustDevice", trustDevice ? "on" : "");
    if (trustDevice) fd.set("pin", pin);
    startTransition(async () => {
      const res = await loginWithPassword(fd);
      if (res && !res.ok) toast.error(res.error);
    });
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-sm font-medium">
              Usuario
            </Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              required
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium">
              Contraseña
            </Label>
            <div className="flex gap-2">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="h-12 text-base"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12 shrink-0"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar" : "Mostrar"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label
                htmlFor="trustDevice"
                className="text-sm font-medium leading-tight"
              >
                Confiar en este dispositivo
                <span className="block text-[11px] font-normal text-muted-foreground">
                  En el futuro podrás entrar solo con un PIN de 4 dígitos.
                </span>
              </Label>
              <Switch
                id="trustDevice"
                checked={trustDevice}
                onCheckedChange={setTrustDevice}
              />
            </div>

            {trustDevice && (
              <div className="space-y-1.5">
                <Label htmlFor="pin" className="text-xs font-medium">
                  Crea un PIN de 4 dígitos
                </Label>
                <Input
                  id="pin"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  value={pin}
                  onChange={(e) =>
                    setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  placeholder="••••"
                  className="h-12 text-center text-2xl tracking-[0.5em] tabular-nums"
                  required
                />
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12"
            disabled={isPending}
          >
            {isPending ? (
              <span>Iniciando…</span>
            ) : (
              <>
                <LogIn className="size-4" /> Iniciar sesión
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
