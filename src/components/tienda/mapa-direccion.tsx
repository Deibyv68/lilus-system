"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapaLeaflet, Marker } from "leaflet";
/*
  Sin esto el mapa sale roto: las piezas de imagen quedan apiladas en una
  columna en vez de formar el mosaico, porque Leaflet las coloca con
  clases de su propia hoja de estilos. Se importa aquí, en el componente,
  para que solo se descargue cuando alguien abre el mapa.
*/
import "leaflet/dist/leaflet.css";

/**
 * Marcar en el mapa dónde entregar.
 *
 * ── Por qué OpenStreetMap y no Google ──
 *
 * Google Maps pide tarjeta de crédito y cobra por consulta pasado un
 * límite. Para una tienda que empieza, eso es un costo variable atado a
 * algo tan básico como decir dónde vives. OpenStreetMap es gratis, sin
 * cuenta y sin clave.
 *
 * ── Lo que el mapa NO hace ──
 *
 * No decide la dirección. Rellena los campos y la persona los corrige.
 * La geocodificación inversa —sacar el nombre de la calle de un punto—
 * funciona bien en el centro de Quito o Guayaquil y regular en el resto:
 * en una urbanización puede devolver «Calle sin nombre» o la avenida de
 * al lado. Dar eso por bueno sin dejar corregir sería mandar guías a
 * direcciones inventadas por un mapa.
 *
 * Lo que sí resuelve de verdad es el punto: aunque la calle salga mal,
 * las coordenadas quedan guardadas con el pedido y el repartidor abre el
 * sitio exacto en su teléfono.
 *
 * ── Por qué Leaflet a pelo y no react-leaflet ──
 *
 * react-leaflet envuelve todo en componentes y arrastra sus propios
 * problemas de compatibilidad con cada versión de React. Aquí hacen falta
 * tres cosas —pintar el mapa, poner un marcador, escuchar un clic— y eso
 * son veinte líneas contra una dependencia más que mantener.
 *
 * La librería se carga con `import()` dentro del efecto porque toca
 * `window` al importarse: en el render del servidor reventaría.
 */

/** Quito. Es donde está el taller y de donde sale la mayoría de pedidos. */
const CENTRO_POR_DEFECTO: [number, number] = [-0.1807, -78.4678];

export type UbicacionElegida = {
  lat: number;
  lng: number;
  /** Lo que el mapa cree que es la calle. Puede venir vacío o mal. */
  calle?: string;
  ciudad?: string;
  provincia?: string;
  /**
   * `true` cuando ya se consultó la dirección de este punto, aunque no
   * haya devuelto calle.
   *
   * Distingue «todavía no sabemos» de «preguntamos y no hay calle». El
   * primero llega en el aviso inmediato, apenas se toca el mapa; el
   * segundo, cuando contesta el servicio. Sin esta marca, quien recibe
   * los datos no puede saber si esperar o si ya no viene nada.
   */
  recibioRespuesta?: boolean;
};

export function MapaDireccion({
  onElegir,
  valorInicial,
}: {
  onElegir: (u: UbicacionElegida) => void;
  valorInicial?: { lat: number; lng: number } | null;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaLeaflet | null>(null);
  const marcador = useRef<Marker | null>(null);
  const [listo, setListo] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  /*
    `onElegir` en una ref y no en las dependencias del efecto.

    Si fuera dependencia, cada render del formulario padre volvería a
    crear el mapa entero: parpadeo, marcador perdido y una fuga de
    memoria por cada tecla que alguien escriba en otro campo.
  */
  const alElegir = useRef(onElegir);
  // La asignación va en un efecto y no en el cuerpo del render: escribir
  // una ref mientras se renderiza es justo lo que React pide no hacer, y
  // aquí no hace falta — el mapa solo la lee cuando alguien toca.
  useEffect(() => {
    alElegir.current = onElegir;
  }, [onElegir]);

  useEffect(() => {
    let vivo = true;
    let limpiar: (() => void) | undefined;

    (async () => {
      const L = (await import("leaflet")).default;
      if (!vivo || !contenedor.current || mapa.current) return;

      const inicio: [number, number] = valorInicial
        ? [valorInicial.lat, valorInicial.lng]
        : CENTRO_POR_DEFECTO;

      const m = L.map(contenedor.current, {
        center: inicio,
        zoom: valorInicial ? 17 : 12,
        // Arranca apagado y se enciende al entrar el puntero. Ver abajo.
        scrollWheelZoom: false,
      });

      /*
        La rueda hace zoom solo mientras el puntero está dentro del mapa.

        Encendido siempre, quien baja por el formulario pasa por encima
        del mapa y la página se queda atrapada haciendo zoom. Apagado
        siempre, el mapa se siente muerto y hay que usar los botones de
        + y −.

        Encenderlo al entrar y apagarlo al salir da las dos cosas: dentro
        se hace zoom, fuera se sigue bajando. Es lo mismo que hace un
        mapa de Google incrustado.

        No aplica al móvil: ahí no hay puntero, y el zoom es con dos
        dedos, que Leaflet maneja aparte y nunca compite con el scroll.
      */
      const el = contenedor.current;
      const encender = () => m.scrollWheelZoom.enable();
      const apagar = () => m.scrollWheelZoom.disable();
      /*
        Se escucha en el elemento y no con `m.on("mouseover")`.

        Leaflet reenvía los eventos del ratón como eventos suyos, pero
        filtra los de entrada y salida para no dispararlos cuando el
        puntero pasa entre sus propias capas internas. `mouseenter` y
        `mouseleave` del DOM no tienen esa complicación: entran y salen
        del contenedor, que es exactamente la pregunta.
      */
      /*
        Y además se corta el scroll de la página a mano.

        Leaflet ya llama a `preventDefault` en su propio manejador, pero
        no siempre llega a tiempo: el navegador puede haber empezado a
        desplazar antes, y el resultado es que el mapa hace zoom y la
        página se mueve un poco a la vez.

        Este listener va con `passive: false` a propósito. Sin esa opción
        el navegador asume que nadie va a cancelar el evento —para poder
        desplazar sin esperar a que corra JavaScript— e ignora el
        `preventDefault`. Es justo lo que hay que desactivar aquí.

        Solo corta cuando el zoom está encendido, o sea cuando el puntero
        está dentro. Fuera del mapa la rueda sigue siendo de la página.
      */
      const cortarScroll = (e: WheelEvent) => {
        if (m.scrollWheelZoom.enabled()) e.preventDefault();
      };

      el.addEventListener("mouseenter", encender);
      el.addEventListener("mouseleave", apagar);
      el.addEventListener("wheel", cortarScroll, { passive: false });

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(m);

      const icono = L.divIcon({
        className: "",
        html: `<div style="width:22px;height:22px;border-radius:50%;background:#e8e2d9;border:3px solid #1c1917;box-shadow:0 2px 8px rgba(0,0,0,.5)"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      if (valorInicial) {
        marcador.current = L.marker(inicio, { icon: icono, draggable: true }).addTo(m);
      }

      async function poner(lat: number, lng: number) {
        if (marcador.current) {
          marcador.current.setLatLng([lat, lng]);
        } else {
          marcador.current = L.marker([lat, lng], { icon: icono, draggable: true }).addTo(m);
          marcador.current.on("dragend", () => {
            const p = marcador.current!.getLatLng();
            poner(p.lat, p.lng);
          });
        }

        // Se entrega el punto de inmediato. La dirección, si llega, llega
        // después: nunca se hace esperar por algo que puede fallar.
        alElegir.current({ lat, lng });

        setBuscando(true);
        setAviso(null);
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=es`,
            { headers: { accept: "application/json" } }
          );
          if (!r.ok) throw new Error(String(r.status));
          const j = await r.json();
          const a = j.address ?? {};
          const calle = [a.road, a.house_number].filter(Boolean).join(" ");
          const ciudad = a.city || a.town || a.village || a.county || "";
          if (!vivo) return;
          if (!calle) {
            setAviso(
              "El mapa no conoce el nombre de esta calle. Escríbela abajo tú."
            );
          }
          alElegir.current({
            lat,
            lng,
            calle,
            ciudad,
            provincia: a.state ?? "",
            recibioRespuesta: true,
          });
        } catch {
          if (vivo) {
            setAviso("No se pudo leer la dirección. El punto sí quedó marcado.");
            /*
              El servicio falló: no sabemos si hay calle o no. Se avisa sin
              `recibioRespuesta` para que nadie borre lo que ya estaba
              escrito basándose en una consulta que ni llegó.
            */
            alElegir.current({ lat, lng });
          }
        } finally {
          if (vivo) setBuscando(false);
        }
      }

      m.on("click", (e) => poner(e.latlng.lat, e.latlng.lng));

      mapa.current = m;
      setListo(true);
      limpiar = () => {
        el.removeEventListener("mouseenter", encender);
        el.removeEventListener("mouseleave", apagar);
        el.removeEventListener("wheel", cortarScroll);
        m.remove();
        mapa.current = null;
        marcador.current = null;
      };
    })();

    return () => {
      vivo = false;
      limpiar?.();
    };
    // Solo al montar: `valorInicial` se usa como punto de partida y no
    // debe reconstruir el mapa si el padre lo vuelve a pasar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function usarMiUbicacion() {
    if (!navigator.geolocation || !mapa.current) return;
    setBuscando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapa.current?.setView([pos.coords.latitude, pos.coords.longitude], 17);
        mapa.current?.fire("click", {
          latlng: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        });
        setBuscando(false);
      },
      () => {
        setBuscando(false);
        setAviso("No nos diste permiso de ubicación. Marca el punto a mano.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-tienda-tenue">
          Toca el mapa donde entregamos. Puedes mover el punto.
        </p>
        <button
          type="button"
          onClick={usarMiUbicacion}
          disabled={!listo || buscando}
          className="rounded-full border border-tienda-linea px-4 py-2 text-xs text-tienda-texto transition-colors duration-[400ms] ease-tienda hover:border-tienda-texto disabled:opacity-50"
        >
          {buscando ? "Buscando…" : "Usar mi ubicación"}
        </button>
      </div>

      <div
        ref={contenedor}
        className="mt-3 h-[280px] w-full overflow-hidden rounded-tienda-sm border border-tienda-linea bg-tienda-velo sm:h-[360px]"
        // Leaflet pinta sus propios controles; sin esto quedan por debajo
        // de la cabecera fija de la tienda.
        style={{ zIndex: 0 }}
      />

      {aviso && (
        <p className="mt-2 text-xs leading-relaxed text-tienda-tenue">{aviso}</p>
      )}
    </div>
  );
}
