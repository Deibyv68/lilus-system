"use client";

import { useState } from "react";
import { MapPin, Truck, CalendarDays } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { PROVINCIAS, cantonEntre } from "@/lib/ecuador";
import { zonaParaCanton } from "@/lib/tienda";
import { DIAS_PREPARACION } from "@/lib/politicas";
import {
  MapaDireccion,
  type UbicacionElegida,
} from "@/components/tienda/mapa-direccion";

export type ZonaDeEnvio = {
  id: string;
  nombre: string;
  porDefecto: boolean;
  precio: number;
  transportadora: string;
  cantones: string[];
};

/**
 * Cuánto cuesta el envío hasta TU casa.
 *
 * ── Qué reemplaza ──
 *
 * Una lista de dos filas: «Quito $3,50 · Fuera de Quito $5,50». Es cierta
 * y no contesta la pregunta que trae quien la lee, que no es cuánto vale
 * cada zona sino cuánto le va a costar a ella. Quien vive en Cumbayá o en
 * Sangolquí tiene que saber que eso sigue siendo cantón Quito para
 * acertar, y muchos no lo saben.
 *
 * Marcando el punto no hay nada que deducir: sale el precio de ahí.
 *
 * ── Y cuándo llega ──
 *
 * Se añade la fecha estimada porque es la otra mitad de la misma
 * pregunta. «Sale del taller en 3 días» obliga a contar con los dedos, y
 * quien cuenta se olvida de que los envíos no salen en domingo.
 *
 * ── Por qué el cálculo se rehace en el servidor al comprar ──
 *
 * Esto es una estimación para decidir, no un precio en firme. El que se
 * cobra lo vuelve a calcular el servidor con la dirección del pedido, en
 * `checkout/actions.ts`, y ahí manda él. Aquí no se puede mentir porque
 * aquí no se cobra.
 */
export function CalculadoraDeEnvio({ zonas }: { zonas: ZonaDeEnvio[] }) {
  const [abierto, setAbierto] = useState(false);
  const [resultado, setResultado] = useState<{
    zona: ZonaDeEnvio;
    lugar: string;
  } | null>(null);
  const [sinCanton, setSinCanton] = useState(false);

  function onUbicacion(u: UbicacionElegida) {
    /*
      El cantón sale de TODOS los nombres que devolvió el mapa, no del
      primero que suene a ciudad: en Tumbaco el mapa manda «Tumbaco» como
      pueblo y «Distrito Metropolitano de Quito» como comarca, y el cantón
      es el segundo. Es la misma regla que usa el checkout — si aquí
      dijera otra cosa, el precio cambiaría al pagar.
    */
    const provincia = u.provincia
      ? PROVINCIAS.find(
          (p) => p.nombre.toLowerCase() === u.provincia!.toLowerCase()
        )
      : null;

    const canton = provincia
      ? cantonEntre(provincia.nombre, u.lugares ?? [])
      : null;

    if (!canton) {
      setResultado(null);
      setSinCanton(true);
      return;
    }

    const zona = zonaParaCanton(zonas, canton);
    setSinCanton(false);
    setResultado(zona ? { zona, lugar: canton } : null);
  }

  return (
    <div className="space-y-5">
      <ul className="space-y-1.5 border-t border-tienda-linea pt-5">
        {zonas.map((z) => (
          <li key={z.id} className="flex justify-between gap-4">
            <span>
              {z.nombre} · {z.transportadora}
            </span>
            <span className="tabular-nums text-tienda-texto">
              {formatCurrency(z.precio)}
            </span>
          </li>
        ))}
      </ul>

      {/*
        El mapa se monta solo al abrirlo.

        Leaflet y sus teselas pesan, y esta sección está al final de una
        ficha de producto: cargarlo para todo el que baje hasta aquí sería
        gastar datos de quien solo quería ver la foto.
      */}
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-tienda-linea px-6 py-3.5 text-sm text-tienda-texto transition-colors duration-[400ms] ease-tienda hover:border-tienda-texto hover:text-white"
      >
        <MapPin className="size-4" />
        {abierto ? "Cerrar el mapa" : "¿Cuánto cuesta hasta mi casa?"}
      </button>

      {abierto && (
        <div className="space-y-4">
          <MapaDireccion onElegir={onUbicacion} />

          {resultado && (
            <div className="rounded-tienda-sm border border-tienda-linea bg-tienda-fondo-alt p-5">
              <p className="text-xs uppercase tracking-wide text-tienda-tenue">
                Hasta {resultado.lugar}
              </p>
              <p className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-4xl leading-none text-white">
                  {formatCurrency(resultado.zona.precio)}
                </span>
                <span className="text-sm text-tienda-tenue">de envío</span>
              </p>

              <p className="mt-4 flex items-center gap-2 text-sm text-tienda-tenue">
                <Truck className="size-4 shrink-0" />
                {resultado.zona.transportadora} · zona {resultado.zona.nombre}
              </p>
              <p className="mt-1.5 flex items-center gap-2 text-sm text-tienda-tenue">
                <CalendarDays className="size-4 shrink-0" />
                Sale del taller alrededor del {fechaDeSalida()}
              </p>
            </div>
          )}

          {sinCanton && (
            <p className="rounded-tienda-sm border border-tienda-linea px-4 py-3 text-sm leading-relaxed text-tienda-tenue">
              No pudimos reconocer ese punto. Prueba tocando un poco más
              cerca de una calle con nombre — o escríbenos y lo vemos.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Cuándo saldría del taller un pedido que se pague hoy.
 *
 * Solo la salida, no la entrega: lo que tarde la transportadora después
 * no lo decidimos nosotros, y prometer una fecha de llegada que depende
 * de otro es prometer lo que no se puede cumplir.
 *
 * Los sábados y domingos no cuentan. Sin eso, un pedido pagado un jueves
 * daría el domingo — un día en el que no se trabaja y no sale nada.
 */
function fechaDeSalida(): string {
  const d = new Date();
  let faltan = DIAS_PREPARACION;
  while (faltan > 0) {
    d.setDate(d.getDate() + 1);
    const dia = d.getDay();
    if (dia !== 0 && dia !== 6) faltan--;
  }
  return d.toLocaleDateString("es-EC", { day: "numeric", month: "long" });
}
