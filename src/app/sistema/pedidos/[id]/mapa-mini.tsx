"use client";

import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import type { Map as MapaLeaflet } from "leaflet";
import { enlaceDeMaps } from "@/lib/punto-de-maps";

/**
 * El punto de entrega, visto.
 *
 * ── Por qué no basta el enlace ──
 *
 * Antes había una línea que decía «Abrir el punto en el mapa», y para
 * saber si el punto tenía sentido había que tocarla, esperar a que
 * abriera Google Maps, mirar, y volver. Nadie hace eso por cada pedido —
 * así que un punto mal marcado por quien compró viajaba hasta la etiqueta
 * sin que nadie lo mirara.
 *
 * Con la vista previa se ve en el sitio: si el punto cayó en otro barrio,
 * salta a la vista antes de imprimir nada. Y sigue llevando a Google
 * Maps al tocarla, que es lo que tiene abierto quien reparte.
 *
 * ── Por qué Leaflet y no una imagen ──
 *
 * Una imagen estática de mapa necesita una clave de API y una cuenta que
 * facturar. Leaflet ya está en el proyecto y las teselas son de
 * OpenStreetMap: sin clave, sin cuenta, y sin otra cosa que mantener.
 *
 * Va con todas las interacciones apagadas. No es un mapa para usar, es
 * una foto que resulta que se dibuja sola — y un mapa que se arrastra
 * dentro de una tarjeta se traga el gesto de bajar por la página.
 */
export function MapaMini({
  lat,
  lng,
  etiqueta,
}: {
  lat: number;
  lng: number;
  /** La dirección escrita, para quien no ve la imagen. */
  etiqueta: string;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaLeaflet | null>(null);

  useEffect(() => {
    if (!contenedor.current || mapa.current) return;
    let vivo = true;

    (async () => {
      const L = await import("leaflet");
      if (!vivo || !contenedor.current || mapa.current) return;

      const m = L.map(contenedor.current, {
        center: [lat, lng],
        zoom: 16,
        // Todo apagado: esto se mira, no se usa.
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false,
        attributionControl: true,
      });

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(m);

      /*
        El punto se dibuja con un círculo y no con el alfiler de Leaflet.

        El alfiler por defecto carga su imagen desde una ruta relativa que
        cambia según dónde esté montada la app, y cuando no la encuentra
        no falla: deja un hueco donde debería estar el punto. Un círculo
        es geometría y siempre se pinta.
      */
      L.circleMarker([lat, lng], {
        radius: 8,
        color: "#ffffff",
        weight: 2,
        fillColor: "#dc2626",
        fillOpacity: 1,
      }).addTo(m);

      mapa.current = m;
    })();

    return () => {
      vivo = false;
      mapa.current?.remove();
      mapa.current = null;
    };
  }, [lat, lng]);

  return (
    <a
      href={enlaceDeMaps({ lat, lng })}
      target="_blank"
      rel="noreferrer"
      className="group mt-3 block overflow-hidden rounded-lg border transition-colors hover:border-primary/50"
      aria-label={`Abrir en Google Maps: ${etiqueta}`}
    >
      <div className="relative">
        <div
          ref={contenedor}
          className="h-[150px] w-full bg-muted"
          style={{ zIndex: 0 }}
          aria-hidden="true"
        />
        {/*
          La capa transparente por encima se come el clic del mapa.

          Sin ella, Leaflet atrapa el toque y el enlace de fuera no llega a
          dispararse: se vería un mapa que no lleva a ninguna parte, que
          es peor que el enlace de texto que había antes.
        */}
        <span className="absolute inset-0" />
      </div>

      <span className="flex items-center gap-1.5 border-t bg-card px-3 py-2 text-xs text-muted-foreground group-hover:text-foreground">
        <MapPin className="size-3.5 shrink-0" />
        Abrir el punto en el mapa
      </span>
    </a>
  );
}
