"use client";

import { useState } from "react";
import { ElegirPedido, type PedidoParaElegir } from "@/components/elegir-pedido";
import { MapaMini } from "@/app/sistema/pedidos/[id]/mapa-mini";
import { Switch } from "@/components/ui/switch";
import { engancharUbicacionAction } from "./actions";

/**
 * Elegir a qué pedido va la ubicación que llegó.
 *
 * La lista es la misma que la del comprobante compartido. Lo propio es lo
 * de arriba: el mapa y lo que el mapa dice que hay ahí.
 *
 * ── Por qué se enseña el punto antes ──
 *
 * Enseñar dónde cae ANTES de pegarlo evita el error que más caro sale:
 * asignarle a un pedido la casa de otra clienta, y descubrirlo cuando el
 * paquete ya salió.
 *
 * ── Por qué la dirección se pregunta y no se impone ──
 *
 * La primera versión solo guardaba el punto, y eso estaba mal: quien
 * comparte una ubicación casi siempre lo hace porque la dirección
 * escrita no sirve. Pero reemplazarla sin preguntar tampoco vale: «De
 * las Alondras y De los Quindes» es como se llama el sitio para quien
 * vive ahí, y OpenStreetMap puede devolver la avenida grande de al lado,
 * que es correcta y no sirve para llegar.
 *
 * Así que se enseña lo que dice el mapa y se deja decidir, con el
 * interruptor encendido: quien llega hasta aquí viene buscando justo eso.
 */
export function ElegirDondeVaLaUbicacion({
  lat,
  lng,
  calleDelMapa,
  postalDelMapa,
  pedidos,
}: {
  lat: number;
  lng: number;
  /** «Principal y Secundaria», si el mapa supo decirlo. */
  calleDelMapa: string | null;
  postalDelMapa: string | null;
  pedidos: PedidoParaElegir[];
}) {
  const [reemplazar, setReemplazar] = useState(true);

  return (
    <ElegirPedido
      pedidos={pedidos}
      onElegir={(id) =>
        engancharUbicacionAction(
          id,
          lat,
          lng,
          postalDelMapa,
          reemplazar ? calleDelMapa : null
        )
      }
      encabezado={
        <div className="space-y-3 rounded-xl border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">La ubicación que llegó</p>
          <MapaMini lat={lat} lng={lng} etiqueta="Ubicación recibida" />

          {calleDelMapa ? (
            <label className="flex items-start gap-3 rounded-md border bg-background px-3 py-2.5">
              <Switch
                checked={reemplazar}
                onCheckedChange={setReemplazar}
                className="mt-0.5"
              />
              <span className="min-w-0 flex-1 text-sm">
                <span className="block">
                  Poner esta dirección:{" "}
                  <strong className="font-medium">{calleDelMapa}</strong>
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {reemplazar
                    ? "Reemplaza la que está escrita en el pedido."
                    : "Se guarda solo el punto; la dirección escrita no se toca."}
                </span>
              </span>
            </label>
          ) : (
            <p className="rounded-md border bg-background px-3 py-2.5 text-xs text-muted-foreground">
              El mapa no supo el nombre de la calle de este punto. Se guarda
              solo la ubicación.
            </p>
          )}

          <p className="text-center font-mono text-2xs text-muted-foreground">
            {lat.toFixed(5)}, {lng.toFixed(5)}
            {postalDelMapa && ` · ${postalDelMapa}`}
          </p>
        </div>
      }
    />
  );
}
