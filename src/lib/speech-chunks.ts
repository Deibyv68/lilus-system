/**
 * Parte un texto largo en frases sueltas.
 *
 * Es lo que evita que Chrome en Android corte la lectura en voz alta a
 * los ~15 segundos: en vez de mandarle un bloque entero al motor, se le
 * encolan frases cortas de a una.
 *
 * Vive aquí y no junto al botón porque las recetas arman sus textos en
 * el servidor, y un archivo `"use client"` no se puede llamar desde ahí.
 */
export function toChunks(text: string): string[] {
  return text
    .split(/(?<=[.:;!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
