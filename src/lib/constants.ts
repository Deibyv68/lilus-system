/**
 * Valores por defecto del negocio, sin dependencias.
 *
 * Vive aparte de order-utils porque ese módulo importa Prisma y estos
 * valores también se usan en componentes de cliente.
 */

/** Vida útil por defecto de un producto, en meses. */
export const DEFAULT_SHELF_LIFE_MONTHS = 6;

/**
 * Nombres de las cookies de sesión.
 *
 * Viven aquí y no en `auth.ts` porque `proxy.ts` las necesita para el
 * chequeo optimista, y `auth.ts` arrastra Prisma y bcrypt. El proxy
 * corre en CADA petición: meterle el cliente de la base por importar
 * dos strings sería caro y además innecesario.
 */
export const SESSION_COOKIE = "lilus_session";
export const DEVICE_COOKIE = "lilus_device";
