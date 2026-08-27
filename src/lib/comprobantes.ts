import "server-only";
import { mkdir, writeFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";

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
 * ── Por qué junto a la base ──
 *
 * Se guardan al lado del archivo de la base de datos, sacando la carpeta
 * de `DATABASE_URL`. Así cualquier respaldo de esa carpeta se los lleva
 * también: separar el comprobante del pedido al que pertenece sería
 * guardar la mitad de la prueba de un pago.
 */

function carpetaDeDatos(): string {
  const url = process.env.DATABASE_URL ?? "";
  const archivo = url.replace(/^file:/, "").trim();

  if (archivo.startsWith("/") || /^[a-zA-Z]:/.test(archivo)) {
    return path.dirname(archivo);
  }

  // Ruta relativa: Prisma las resuelve desde `prisma/`, no desde la raíz.
  return path.resolve(process.cwd(), "prisma", path.dirname(archivo || "."));
}

export function carpetaDeComprobantes(): string {
  return path.join(carpetaDeDatos(), "comprobantes");
}

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

  const carpeta = carpetaDeComprobantes();
  await mkdir(carpeta, { recursive: true });

  /*
    El nombre lo pone el servidor, nunca quien sube.

    Un nombre de archivo que viene de fuera puede traer `../` y escribir
    donde no debe. Con un UUID no hay nada que sanear.
  */
  const archivo = `${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(carpeta, archivo), bytes);

  return { archivo, tipo: file.type, bytes: file.size };
}

/**
 * Abre un comprobante para servirlo.
 *
 * Devuelve `null` si no está — un archivo borrado a mano no debe tumbar
 * la página del pedido.
 */
export async function leerComprobante(archivo: string) {
  /*
    Solo el nombre, sin carpetas.

    `path.basename` corta cualquier intento de salir de la carpeta con
    `../`. Aunque el nombre venga de la base y lo hayamos puesto nosotros,
    esto es de las cosas que no cuestan nada y evitan que un cambio futuro
    abra un agujero sin que nadie se dé cuenta.
  */
  const limpio = path.basename(archivo);
  const destino = path.join(carpetaDeComprobantes(), limpio);

  try {
    const info = await stat(destino);
    if (!info.isFile()) return null;
    return { flujo: createReadStream(destino), bytes: info.size };
  } catch {
    return null;
  }
}
