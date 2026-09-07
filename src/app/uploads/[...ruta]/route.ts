import { NextResponse } from "next/server";
import { leer, extensionServible } from "@/lib/almacen";

export const dynamic = "force-dynamic";

/**
 * Sirve los archivos que sube el panel: fotos de productos y packs, y los
 * PDF de las etiquetas.
 *
 * ── Por qué existe ──
 *
 * En producción Next arma la lista de archivos de `public` UNA VEZ, al
 * arrancar. Todo lo que se sube después no está en esa lista y devuelve
 * 404 hasta que alguien reinicie: la foto se guardaba bien, quedaba en el
 * disco, y en pantalla salía rota.
 *
 * Con los archivos en R2 el motivo es otro y más simple: ahí no hay
 * `public` que valga, y esta es la única puerta.
 *
 * En la laptop, los archivos que ya existían al arrancar los sigue
 * sirviendo Next directamente, que es más rápido; aquí solo caen los que
 * él no conoce. Por eso no hizo falta cambiar ninguna dirección guardada.
 *
 * ── Por qué no se enseña el bucket ──
 *
 * R2 puede publicarse en su propio dominio, y así los archivos irían del
 * borde al navegador sin pasar por aquí. No se hace: un bucket público es
 * una segunda puerta que hay que recordar cerrar, y en este mismo bucket
 * viven los comprobantes de pago. Una sola puerta, con una sola regla.
 */

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ruta: string[] }> }
) {
  const { ruta } = await params;
  const nombre = ruta.join("/");

  /*
    Solo lo que sabemos servir. Antes esto era una tabla de extensiones
    aquí mismo; ahora la comparte con el almacén, para que no se puedan
    separar la lista de lo servible y la de los tipos que se anuncian.
  */
  if (!extensionServible(nombre)) {
    return new NextResponse("No encontrado", { status: 404 });
  }

  /*
    El `..` lo rechaza el almacén, que devuelve null. La comprobación vive
    ahí y no aquí a propósito: es la misma regla para todo el que guarde o
    lea un archivo, y repartida por cada llamada es la clase de regla que
    se olvida en la siguiente.
  */
  const archivo = await leer(`uploads/${nombre}`);
  if (!archivo) return new NextResponse("No encontrado", { status: 404 });

  return new NextResponse(archivo.bytes as unknown as BodyInit, {
    headers: {
      "Content-Type": archivo.tipo,
      "Content-Length": String(archivo.tamano),
      // El nombre lleva un identificador único y nunca se reescribe, así
      // que se puede cachear sin miedo a servir una foto vieja.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
