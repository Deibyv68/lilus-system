"use client";

import { estadoDePago, type ComprobanteParaContar } from "@/lib/pago-del-pedido";

/**
 * Los filtros de la lista de pedidos.
 *
 * ── Por qué estos y no los seis estados ──
 *
 * Un filtro por cada estado sería lo obvio y sería inútil: «Empaquetado»
 * y «Enviado» separan pedidos que se atienden igual, y en cambio no
 * separan lo único que de verdad hace falta separar — lo que espera algo
 * de ti de lo que ya siguió su camino.
 *
 * Así que los filtros van por lo que hay que HACER con cada pedido:
 *
 *   · Por cobrar   — pendientes: hay que mirar el banco.
 *   · Por revisar  — llegó un comprobante y nadie lo ha mirado.
 *   · Por preparar — pagados, esperando salir del taller.
 *   · En camino    — empaquetados y enviados; ya no dependen de ti.
 *   · Cerrados     — entregados y cancelados.
 *
 * «Por revisar» se cruza con «Por cobrar» a propósito: un pedido puede
 * estar en los dos. No son cajones excluyentes, son preguntas distintas
 * sobre el mismo montón.
 *
 * ── Y el origen ──
 *
 * «De la web» va aparte porque responde otra pregunta: no qué hacer, sino
 * de dónde vino. Sirve para ver si la tienda está vendiendo sola, que es
 * justo lo que se quiere saber al abrirla.
 */

export type Filtro =
  | "todos"
  | "cobrar"
  | "revisar"
  | "preparar"
  | "camino"
  | "cerrados"
  | "web";

export const ETIQUETA_FILTRO: Record<Filtro, string> = {
  todos: "Todos",
  cobrar: "Por cobrar",
  revisar: "Por revisar",
  preparar: "Por preparar",
  camino: "En camino",
  cerrados: "Cerrados",
  web: "De la web",
};

/** El orden en que se pintan: el trabajo primero, el archivo al final. */
const ORDEN: Filtro[] = [
  "todos",
  "cobrar",
  "revisar",
  "preparar",
  "camino",
  "cerrados",
  "web",
];

type PedidoFiltrable = {
  status: string;
  source: string | null;
  total: number;
  comprobantes: ComprobanteParaContar[];
};

export function pasaElFiltro(o: PedidoFiltrable, filtro: Filtro): boolean {
  switch (filtro) {
    case "todos":
      return true;
    case "cobrar":
      return o.status === "PENDING";
    case "revisar":
      return estadoDePago(o.comprobantes, o.total).porRevisar > 0;
    case "preparar":
      return o.status === "PAID";
    case "camino":
      return o.status === "PACKED" || o.status === "SHIPPED";
    case "cerrados":
      return o.status === "DELIVERED" || o.status === "CANCELLED";
    case "web":
      return o.source === "Web";
  }
}

export function contarPorFiltro(
  pedidos: PedidoFiltrable[]
): Record<Filtro, number> {
  const cuentas = {} as Record<Filtro, number>;
  for (const f of ORDEN) {
    cuentas[f] = pedidos.filter((o) => pasaElFiltro(o, f)).length;
  }
  return cuentas;
}

export function Filtros({
  actual,
  onCambiar,
  cuentas,
}: {
  actual: Filtro;
  onCambiar: (f: Filtro) => void;
  cuentas: Record<Filtro, number>;
}) {
  /*
    Un filtro sin nada dentro no se pinta, salvo el que esté puesto.

    Un botón que lleva a una lista vacía es una promesa rota, y con seis
    de ellos la fila se convierte en decoración. El puesto se queda
    aunque se vacíe, porque si no desaparecería bajo el dedo justo al
    revisar el último pedido que le quedaba.
  */
  const visibles = ORDEN.filter((f) => cuentas[f] > 0 || f === actual);

  return (
    <div
      className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
      role="group"
      aria-label="Filtrar pedidos"
    >
      {visibles.map((f) => {
        const puesto = f === actual;
        return (
          <button
            key={f}
            type="button"
            onClick={() => onCambiar(f)}
            aria-pressed={puesto}
            /*
              `shrink-0` y scroll horizontal: en un teléfono no caben
              siete. Antes que apilarlos en dos filas —que empuja la lista
              hacia abajo en la pantalla donde menos sitio hay— se
              deslizan.
            */
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              puesto
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
            }`}
          >
            {ETIQUETA_FILTRO[f]}
            <span
              className={`ml-1.5 tabular-nums ${
                puesto ? "opacity-70" : "opacity-60"
              }`}
            >
              {cuentas[f]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
