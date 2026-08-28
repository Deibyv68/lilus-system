"use client";

import { useState, useTransition } from "react";
import { Link2, MapPin, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapaDireccion } from "@/components/tienda/mapa-direccion";
import { enlaceDeMaps, type Punto } from "@/lib/punto-de-maps";
import { resolverEnlaceDeMapsAction } from "./resolver-maps";

/**
 * Dónde queda, en un pedido cargado a mano.
 *
 * ── Por qué falta aquí y no en la web ──
 *
 * Quien compra en la tienda marca su punto en un mapa. Quien compra por
 * WhatsApp dicta sus calles, y «de las Alondras y de los Quindes» describe
 * un sitio real que ningún repartidor va a encontrar. El pedido manual
 * nacía sin punto, y era justo el que más lo necesitaba.
 *
 * ── Dos caminos, porque llegan de dos formas ──
 *
 * Pegar el enlace: es lo que hace la mayoría — abre Maps, marca su casa y
 * comparte. Un toque, y el punto es el que ella misma eligió, que es más
 * fiable que cualquier interpretación de sus calles.
 *
 * Marcar en el mapa: para cuando describe por dónde vive sin mandar nada.
 *
 * Los dos son opcionales. Escribir las calles a mano sigue bastando, como
 * hasta ahora: esto añade, no obliga.
 */
export function Ubicacion({
  punto,
  onCambiar,
}: {
  punto: Punto | null;
  onCambiar: (p: Punto | null) => void;
}) {
  const [enlace, setEnlace] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mapaAbierto, setMapaAbierto] = useState(false);
  const [resolviendo, empezar] = useTransition();

  function pegar() {
    setError(null);
    empezar(async () => {
      const r = await resolverEnlaceDeMapsAction(enlace);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      onCambiar(r.punto);
      setEnlace("");
      setMapaAbierto(true);
    });
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Punto en el mapa</p>
        <span className="text-xs text-muted-foreground">Opcional</span>
      </div>

      {punto ? (
        <div className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2">
          <span className="flex min-w-0 items-center gap-2 text-sm">
            <Check className="size-4 shrink-0 text-emerald-600" />
            <a
              href={enlaceDeMaps(punto)}
              target="_blank"
              rel="noreferrer"
              className="truncate font-mono text-xs hover:underline"
            >
              {punto.lat.toFixed(5)}, {punto.lng.toFixed(5)}
            </a>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 px-2 text-xs"
            onClick={() => onCambiar(null)}
          >
            <X className="size-3.5" /> Quitar
          </Button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={enlace}
                onChange={(e) => setEnlace(e.target.value)}
                placeholder="Pega el enlace de Google Maps que te mandó"
                className="pl-9"
                inputMode="url"
                /*
                  Enter pega en vez de mandar el pedido: este campo está
                  dentro del formulario grande, y dar a Enter aquí crearía
                  el pedido a medio llenar.
                */
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    pegar();
                  }
                }}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={pegar}
              disabled={resolviendo || !enlace.trim()}
            >
              {resolviendo ? "Leyendo…" : "Usar"}
            </Button>
          </div>

          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
        </>
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-full justify-start px-2 text-xs"
        onClick={() => setMapaAbierto((v) => !v)}
      >
        <MapPin className="size-3.5" />
        {mapaAbierto
          ? "Cerrar el mapa"
          : punto
            ? "Mover el punto en el mapa"
            : "O marcarlo en el mapa"}
      </Button>

      {/*
        El mapa se monta solo al abrirlo.

        Leaflet trae sus tiles al montarse y pesa; cargarlo en cada pedido
        nuevo —cuando la mayoría se resuelven con el enlace pegado— sería
        gastar datos de la casa en algo que casi nadie mira.
      */}
      {mapaAbierto && (
        <MapaDireccion
          tema="panel"
          valorInicial={punto}
          onElegir={(u) => onCambiar({ lat: u.lat, lng: u.lng })}
        />
      )}
    </div>
  );
}
