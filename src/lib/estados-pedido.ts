/**
 * Cómo se llama y de qué color va cada estado de un pedido.
 *
 * Vivía copiado en la lista de pedidos y en la portada del panel, y ya
 * habían empezado a separarse: en una salía «Pendiente» sobre ámbar y en
 * la otra una etiqueta gris con borde. Son la misma pantalla para quien
 * la usa —abre la portada, ve un pedido, entra a la lista— y que el mismo
 * pedido se pinte distinto obliga a traducir entre dos vistas de la misma
 * app.
 *
 * El color no es decoración: ámbar es «esto espera algo de ti», verde es
 * «terminado», rojo es «se cayó». Se lee antes que la palabra.
 */

export const ETIQUETA_ESTADO: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  PACKED: "Empaquetado",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

export const COLOR_ESTADO: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  PAID: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  PACKED: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
  SHIPPED: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200",
  DELIVERED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

/** Para un estado que no conocemos, mejor mostrarlo crudo que no mostrar nada. */
export function etiquetaDeEstado(estado: string): string {
  return ETIQUETA_ESTADO[estado] ?? estado;
}

export function colorDeEstado(estado: string): string {
  return COLOR_ESTADO[estado] ?? "bg-muted text-muted-foreground";
}
