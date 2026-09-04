/**
 * El vocabulario del historial de un pedido.
 *
 * Vive aparte de `historial-pedido.ts` porque ese es `server-only` —lee
 * la base— y esto lo necesita también el componente que lo pinta en el
 * navegador. Son unas cuantas cadenas y un tipo; arrastrar el módulo
 * entero al cliente por leerlas rompería la compilación, y con razón.
 */

/**
 * Las cuatro clases de acto que se anotan.
 *
 * - `ESTADO`  — el pedido se movió de estado.
 * - `MENSAJE` — se preparó un mensaje para la clienta. Ver la nota de
 *               abajo sobre por qué NO dice «enviado».
 * - `GUIA`    — se anotó el número de guía de la transportadora.
 * - `CORREO`  — salió (o no) el correo automático de confirmación. Este
 *               es el único que sí sabe si llegó a irse, porque lo manda
 *               el propio sistema.
 */
export const TIPOS_DE_EVENTO = ["ESTADO", "MENSAJE", "GUIA", "CORREO"] as const;
export type TipoDeEvento = (typeof TIPOS_DE_EVENTO)[number];

/**
 * Qué mensaje se preparó.
 *
 * - `estado` — el aviso de que el pedido cambió de estado.
 * - `cobro`  — el «todavía falta $X» de la tarjeta de pago.
 */
export const CLASES_DE_MENSAJE = ["estado", "cobro"] as const;
export type ClaseDeMensaje = (typeof CLASES_DE_MENSAJE)[number];

export function esClaseDeMensaje(v: string): v is ClaseDeMensaje {
  return (CLASES_DE_MENSAJE as readonly string[]).includes(v);
}

/**
 * El dibujo que lleva cada línea.
 *
 * Son nombres, no iconos: esta librería no sabe de React y no debería.
 * Quien pinta decide qué svg le corresponde a cada nombre.
 */
export type IconoDelHistorial =
  | "creado"
  | "estado"
  | "mensaje"
  | "correo"
  | "guia"
  | "comprobante"
  | "revisado"
  | "descartado";

/** Verde para lo que salió bien, ámbar para lo que espera algo, rojo para lo que falló. */
export type TonoDelHistorial = "normal" | "bueno" | "aviso" | "malo";

/**
 * Una línea del historial, ya masticada por el servidor.
 *
 * `cuando` va como ISO y no como texto ya formateado: la hora se pinta
 * en el reloj de quien mira, y el servidor de la laptop y el teléfono de
 * quien lo abre no tienen por qué estar en la misma zona.
 */
export type EntradaDelHistorial = {
  id: string;
  cuando: string;
  icono: IconoDelHistorial;
  titulo: string;
  detalle?: string | null;
  /** El nombre de quien lo hizo, si se sabe. */
  porQuien?: string | null;
  tono?: TonoDelHistorial;
};
