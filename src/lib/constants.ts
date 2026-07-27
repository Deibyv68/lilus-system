/**
 * Valores por defecto del negocio, sin dependencias.
 *
 * Vive aparte de order-utils porque ese módulo importa Prisma y estos
 * valores también se usan en componentes de cliente.
 */

/** Vida útil por defecto de un producto, en meses. */
export const DEFAULT_SHELF_LIFE_MONTHS = 6;
