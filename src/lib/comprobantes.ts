import "server-only";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { guardar, leer, borrar } from "./almacen";

/**
 * Dónde viven los comprobantes de pago.
 *
 * ── Por qué NO van en `public/uploads` ──
 *
 * Un comprobante lleva el nombre de quien pagó, su banco y su número de
 * cuenta. Eso no puede quedar en una carpeta que el servidor sirve a
 * cualquiera que acierte la dirección.
 *
 * Y no basta con ponerle un nombre de archivo imposible de adivinar.
 * Next arma la lista de archivos de `public` UNA vez, al arrancar: lo que
 * se sube después cae en la ruta `/uploads/[...ruta]`, donde sí se podría
 * filtrar — pero en cuanto el servidor se reinicia, ese mismo archivo
 * pasa a estar en la lista y se sirve solo, sin pasar por ningún control.
 * O sea que el filtro funcionaría hasta el próximo reinicio. Eso no es un
 * control, es un plazo.
 *
 * Viviendo fuera de `public`, no hay forma de llegar a ellos salvo por la
 * ruta que los protege.
 *
 * ── Dónde acaban ──
 *
 * Eso lo decide `almacen.ts`. En la laptop, junto al archivo de la base,
 * para que cualquier respaldo de esa carpeta se los lleve: separar el
 * comprobante del pedido al que pertenece sería guardar la mitad de la
 * prueba de un pago. En la nube, en R2, bajo el prefijo `comprobantes/`.
 *
 * Aquí solo se decide qué se acepta y con qué nombre se guarda.
 */

const TIPOS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "application/pdf": "pdf",
};

/**
 * 8 MB.
 *
 * Una foto de pantalla de un banco pesa menos de uno. El límite está para
 * que nadie llene el disco de la laptop subiendo vídeos, no para apretar
 * a quien manda su comprobante desde un teléfono viejo.
 */
export const TAMANO_MAXIMO = 8 * 1024 * 1024;

export type ComprobanteGuardado = {
  archivo: string;
  tipo: string;
  bytes: number;
};

export async function guardarComprobante(
  file: File
): Promise<ComprobanteGuardado> {
  const extension = TIPOS[file.type];
  if (!extension) {
    throw new Error("Solo se aceptan fotos (JPG, PNG, WEBP) o PDF");
  }
  if (file.size === 0) throw new Error("El archivo llegó vacío");
  if (file.size > TAMANO_MAXIMO) {
    throw new Error("El archivo pesa más de 8 MB. Manda una foto más liviana.");
  }

  /*
    El nombre lo pone el servidor, nunca quien sube.

    Un nombre de archivo que viene de fuera puede traer `../` y escribir
    donde no debe. Con un UUID no hay nada que sanear.
  */
  const archivo = `${randomUUID()}.${extension}`;
  await guardar(
    clave(archivo),
    new Uint8Array(await file.arrayBuffer()),
    file.type
  );

  return { archivo, tipo: file.type, bytes: file.size };
}

/**
 * Abre un comprobante para servirlo.
 *
 * Devuelve `null` si no está — un archivo borrado a mano no debe tumbar
 * la página del pedido.
 */
export async function leerComprobante(archivo: string) {
  return leer(clave(archivo));
}

/**
 * Borra el archivo de un comprobante del disco.
 *
 * Se usa al borrar su fila. El nombre siempre viene de la base —lo puso
 * el servidor al guardarlo— pero se comprueba igual que no lleve
 * carpetas: un `../` aquí borraría algo que no es un comprobante, y
 * borrar es lo único que no tiene vuelta atrás.
 */
export async function borrarArchivoDeComprobante(archivo: string) {
  if (!archivo || archivo.includes("/") || archivo.includes("\\")) return;
  if (archivo.includes("..")) return;
  await borrar(clave(archivo));
}

/**
 * La clave del archivo dentro del almacén.
 *
 * `path.basename` corta cualquier intento de salir de la carpeta con
 * `../`. Aunque el nombre venga de la base y lo hayamos puesto nosotros,
 * esto no cuesta nada y evita que un cambio futuro abra un agujero sin
 * que nadie se dé cuenta.
 */
function clave(archivo: string): string {
  return `comprobantes/${path.basename(archivo)}`;
}
