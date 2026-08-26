import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { UPLOAD_ROOT } from "@/lib/uploads";

export const dynamic = "force-dynamic";

/**
 * Sirve los archivos que sube el usuario: fotos de productos y packs, y
 * los PDF de las etiquetas.
 *
 * Existe porque en producción Next arma la lista de archivos de `public`
 * UNA VEZ, al arrancar. Todo lo que se sube después no está en esa lista
 * y devuelve 404 hasta que alguien reinicie el servidor: la foto se
 * guardaba bien, quedaba en el disco, y en pantalla salía rota.
 *
 * Los archivos que ya existían al arrancar los sigue sirviendo Next
 * directamente, que es más rápido; acá solo caen los que él no conoce.
 * Por eso no hizo falta cambiar ninguna dirección ya guardada.
 */

const TIPOS: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ruta: string[] }> }
) {
  const { ruta } = await params;

  const destino = path.resolve(UPLOAD_ROOT, ...ruta);

  // Sin esto, un nombre con ".." dejaría leer cualquier archivo del
  // servidor a través de esta dirección.
  const raiz = path.resolve(UPLOAD_ROOT);
  if (destino !== raiz && !destino.startsWith(raiz + path.sep)) {
    return new NextResponse("No encontrado", { status: 404 });
  }

  const tipo = TIPOS[path.extname(destino).toLowerCase()];
  if (!tipo) return new NextResponse("No encontrado", { status: 404 });

  let info;
  try {
    info = await stat(destino);
  } catch {
    return new NextResponse("No encontrado", { status: 404 });
  }
  if (!info.isFile()) return new NextResponse("No encontrado", { status: 404 });

  const stream = Readable.toWeb(
    createReadStream(destino)
  ) as unknown as ReadableStream;

  return new NextResponse(stream, {
    headers: {
      "Content-Type": tipo,
      "Content-Length": String(info.size),
      // El nombre lleva un identificador único y nunca se reescribe, así
      // que se puede cachear sin miedo a servir una foto vieja.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
