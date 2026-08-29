"use client";

import { ElegirPedido, type PedidoParaElegir } from "@/components/elegir-pedido";
import { engancharCompartidoAction } from "./actions";

/**
 * Elegir a qué pedido pertenece el comprobante que llegó compartido.
 *
 * La lista vive en `components/elegir-pedido.tsx`, compartida con la
 * ubicación que llega al abrirla «con» LILUS: las dos son la misma
 * pregunta —«¿de qué pedido es esto?»— hecha sobre cosas distintas.
 *
 * Aquí solo queda lo propio: enseñar la imagen antes de engancharla,
 * porque en el salto desde otra app es fácil mandar la foto equivocada —
 * el chat tiene veinte.
 */
export function ElegirPedidoParaComprobante({
  archivo,
  tipo,
  bytes,
  pedidos,
}: {
  archivo: string;
  tipo: string;
  bytes: number;
  pedidos: PedidoParaElegir[];
}) {
  return (
    <ElegirPedido
      pedidos={pedidos}
      onElegir={(id) => engancharCompartidoAction(id, archivo, tipo, bytes)}
      encabezado={
        <div className="rounded-xl border bg-muted/30 p-3">
          <p className="mb-2 text-xs text-muted-foreground">Lo que compartiste</p>
          {tipo === "application/pdf" ? (
            <p className="rounded-md border bg-background px-3 py-6 text-center text-sm">
              Comprobante en PDF
            </p>
          ) : (
            /*
              Con <img> y no con next/image: el optimizador pediría la
              imagen desde el servidor, sin la cookie de sesión, y la ruta
              le respondería 404. Aquí la pide el navegador, que sí la lleva.
            */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/compartido/${archivo}`}
              alt="Comprobante compartido"
              className="mx-auto max-h-64 rounded-md border bg-white object-contain"
            />
          )}
        </div>
      }
    />
  );
}
