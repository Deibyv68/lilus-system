"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

/**
 * Campo numérico que se puede dejar vacío mientras se escribe.
 *
 * El problema que resuelve: con `parseInt(e.target.value || "1")` el campo
 * nunca se puede borrar — al quedar vacío el fallback lo reescribe al
 * instante y el cursor se queda peleando con el valor. Aquí guardamos el
 * texto tal cual mientras el campo tiene foco, y solo normalizamos al
 * salir (blur), que es cuando el usuario terminó de escribir.
 */
export function NumberField({
  value,
  onChange,
  min,
  max,
  step = 1,
  fallback,
  className,
  ...rest
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Valor al que se vuelve si el campo queda vacío al salir. Por defecto `min` o 0. */
  fallback?: number;
  className?: string;
} & Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "min" | "max" | "step" | "type"
>) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  // Si el valor cambia desde fuera (botones +/-, reset) y no estamos
  // escribiendo, reflejarlo en el texto.
  useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);

  function clamp(n: number) {
    let out = n;
    if (typeof min === "number") out = Math.max(min, out);
    if (typeof max === "number") out = Math.min(max, out);
    return out;
  }

  return (
    <Input
      {...rest}
      type="number"
      inputMode={step < 1 ? "decimal" : "numeric"}
      min={min}
      max={max}
      step={step}
      value={text}
      className={className}
      onFocus={(e) => {
        setFocused(true);
        rest.onFocus?.(e);
      }}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        // Solo propagamos si es un número utilizable; mientras esté vacío
        // o a medio escribir ("-", "1.") no tocamos el estado de arriba.
        const n = step < 1 ? parseFloat(raw) : parseInt(raw, 10);
        if (raw !== "" && !Number.isNaN(n)) onChange(clamp(n));
      }}
      onBlur={(e) => {
        setFocused(false);
        const n = step < 1 ? parseFloat(text) : parseInt(text, 10);
        const final = Number.isNaN(n) ? (fallback ?? min ?? 0) : clamp(n);
        setText(String(final));
        onChange(final);
        rest.onBlur?.(e);
      }}
    />
  );
}
