/**
 * Los plazos y las reglas de venta, en un solo lugar.
 *
 * Aparecen en las páginas legales, en el checkout y en los correos. Tres
 * copias del número «3 días» son tres oportunidades de que uno quede viejo
 * cuando cambie la política, y una tienda que promete cinco días en una
 * página y tres en otra pierde la discusión sola.
 *
 * Si algún día esto tiene que cambiarlo la dueña sin tocar código, se
 * mueve a Configuración. Hoy no vale la pena: son valores que cambian una
 * vez al año, si acaso.
 */

/** Días hábiles que toma preparar y despachar, desde que se confirma el pago. */
export const DIAS_PREPARACION = 3;

/** Días que se espera la transferencia antes de cancelar el pedido. */
export const DIAS_PARA_TRANSFERIR = 2;

/** Cómo se cobra hoy. Cuando haya pasarela, esto deja de ser una constante. */
export const METODO_DE_PAGO = "transferencia bancaria";

export const ULTIMA_ACTUALIZACION_LEGAL = "26 de agosto de 2026";
