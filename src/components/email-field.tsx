"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

/**
 * Campo de email con sugerencias de dominio.
 *
 * En móvil escribir "@gmail.com" cada vez es tedioso y propenso a erratas.
 * Apenas hay algo escrito antes de la arroba, se ofrecen los dominios más
 * usados en Ecuador como botones; al tocar uno se completa el correo.
 *
 * Si el usuario ya empezó a escribir el dominio, la lista se filtra por lo
 * que lleva tecleado ("@gm" → gmail.com).
 */

// Orden intencional: los de arriba son los que más aparecen en los pedidos.
const DOMAINS = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "hotmail.es",
  "icloud.com",
  "live.com",
  "outlook.es",
  "yahoo.es",
  "proton.me",
];

const MAX_SUGGESTIONS = 4;

export function EmailField({
  value,
  onChange,
  placeholder = "cliente@email.com",
  className,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}) {
  const [touched, setTouched] = useState(false);

  const suggestions = useMemo(() => {
    const raw = value.trim();
    if (!raw) return [];

    const at = raw.indexOf("@");
    const local = at === -1 ? raw : raw.slice(0, at);
    const domainPart = at === -1 ? "" : raw.slice(at + 1).toLowerCase();

    // Sin nombre antes de la arroba no hay nada que completar
    if (!local) return [];

    // Si el dominio ya está escrito completo y es uno de los nuestros,
    // no hace falta sugerir nada.
    if (DOMAINS.includes(domainPart)) return [];

    const matches = domainPart
      ? DOMAINS.filter((d) => d.startsWith(domainPart))
      : DOMAINS;

    return matches.slice(0, MAX_SUGGESTIONS).map((d) => `${local}@${d}`);
  }, [value]);

  const showSuggestions = touched && suggestions.length > 0;

  return (
    <div>
      <Input
        id={id}
        type="email"
        inputMode="email"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        onChange={(e) => {
          setTouched(true);
          onChange(e.target.value);
        }}
        onFocus={() => setTouched(true)}
        placeholder={placeholder}
        className={className}
      />

      {showSuggestions && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {suggestions.map((s) => {
            const domain = s.slice(s.indexOf("@"));
            return (
              <button
                key={s}
                type="button"
                // onMouseDown en vez de onClick: se dispara antes del blur,
                // así el botón no desaparece bajo el dedo antes de registrarse.
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(s);
                }}
                className="px-2.5 py-1.5 rounded-full border bg-muted/50 hover:bg-accent active:scale-95 transition text-xs font-medium tabular-nums"
              >
                {domain}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
