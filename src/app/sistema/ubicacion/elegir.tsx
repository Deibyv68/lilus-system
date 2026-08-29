"use client";

import { ElegirPedido, type PedidoParaElegir } from "@/components/elegir-pedido";
import { MapaMini } from "@/app/sistema/pedidos/[id]/mapa-mini";
import { engancharUbicacionAction } from "./actions";

/**
 * Elegir a qué pedido va la ubicación que llegó.
 *
 * La lista es la misma que la del comprobante compartido. Lo propio es el
 * mapa de arriba: enseñar dónde cae el punto ANTES de pegarlo evita el
 * error que más caro sale — asignarle a un pedido la casa de otra
 * clienta, y descubrirlo cuando el paquete ya salió.
 */
export function ElegirDondeVaLaUbicacion({
  lat,
  lng,
  pedidos,
}: {
  lat: number;
  lng: number;
  pedidos: PedidoParaElegir[];
}) {
  return (
    <ElegirPedido
      pedidos={pedidos}
      /*
        El código postal se deja en nulo: sacarlo pediría salir a la red
        desde aquí, y este punto se puede completar después abriendo el
        mapa del pedido. Lo que no puede esperar es el punto.
      */
      onElegir={(id) => engancharUbicacionAction(id, lat, lng, null)}
      encabezado={
        <div className="rounded-xl border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">La ubicación que llegó</p>
          <MapaMini lat={lat} lng={lng} etiqueta="Ubicación recibida" />
          <p className="mt-2 text-center font-mono text-2xs text-muted-foreground">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </p>
        </div>
      }
    />
  );
}
