"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, X, User } from "lucide-react";

export type FoundCustomer = {
  id: string;
  name: string;
  cedula: string | null;
  phone: string | null;
  email: string | null;
  orderCount: number;
  lastAddress: {
    province: string;
    city: string;
    address: string;
    reference: string | null;
    zoneId: string | null;
    zoneName: string | null;
  } | null;
};

export function CustomerSearch({
  onSelect,
}: {
  onSelect: (c: FoundCustomer) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoundCustomer[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Debounce
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/customers/search?q=${encodeURIComponent(query.trim())}`
        );
        if (res.ok) {
          const data = (await res.json()) as FoundCustomer[];
          setResults(data);
          setOpen(true);
        }
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente existente por nombre, cédula o teléfono…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="pl-9 pr-9"
        />
        {query && (
          <button
            type="button"
            aria-label="Limpiar"
            onClick={() => {
              setQuery("");
              setResults([]);
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {open && (results.length > 0 || loading) && (
        <div className="absolute z-20 mt-1 w-full rounded-md border bg-popover shadow-md overflow-hidden">
          {loading && results.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              Buscando…
            </div>
          )}
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onSelect(c);
                setOpen(false);
                setQuery("");
                setResults([]);
              }}
              className="w-full text-left px-3 py-2 hover:bg-accent border-b last:border-b-0 flex items-start gap-3"
            >
              <User className="size-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {[c.cedula, c.phone, c.email].filter(Boolean).join(" · ") ||
                    "Sin contacto"}
                </p>
                {c.lastAddress && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    {c.lastAddress.city}, {c.lastAddress.province} ·{" "}
                    {c.lastAddress.address}
                  </p>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {c.orderCount} pedido{c.orderCount !== 1 ? "s" : ""}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
