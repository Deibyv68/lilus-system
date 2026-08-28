import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/guard";
import { guardarComprobante } from "@/lib/comprobantes";

export const dynamic = "force-dynamic";

/**
 * Lo que llega al compartir una imagen con LILUS desde otra app.
 *
 * ── Qué resuelve ──
 *
 * El comprobante llega por WhatsApp. Hasta ahora había que guardarlo en
 * la galería, abrir el panel, buscar el pedido, tocar «adjuntar» y
 * encontrarlo otra vez entre las fotos — cinco pasos con el teléfono en
 * la mano y el chat abierto detrás. Con esto son dos: compartir → elegir
 * el pedido.
 *
 * ── Cómo funciona ──
 *
 * Android ofrece la app en el menú de compartir porque el manifiesto
 * declara `share_target`. Al elegirla, el sistema hace un POST aquí con
 * el archivo dentro. Esto NO es una página: es la puerta de entrada, y
 * termina redirigiendo a la pantalla donde se elige el pedido.
 *
 * ── Por qué se guarda antes de elegir el pedido ──
 *
 * Porque el archivo solo viene en este POST. Si se pidiera elegir primero
 * y guardar después, habría que arrastrarlo por la navegación —y un
 * archivo no cabe en una dirección web—. Se guarda ya, y se engancha al
 * pedido en el paso siguiente.
 *
 * Eso deja archivos sueltos si alguien comparte y cierra sin elegir.
 * Ocupan lo que ocupa una captura de pantalla y no aparecen en ningún
 * sitio: no llevan fila en la base, así que no hay pedido que los enseñe.
 */
export async function POST(req: NextRequest) {
  /*
    Sin sesión no se guarda nada.

    Compartir abre la app instalada, que casi siempre tiene la sesión
    viva. Cuando no, se manda al login en vez de escribir un archivo que
    nadie ha pedido — esta ruta la puede invocar cualquier app del
    teléfono.
  */
  const usuario = await currentUser();
  if (!usuario) {
    return NextResponse.redirect(new URL("/login", req.url), 303);
  }

  let archivo: unknown;
  try {
    const form = await req.formData();
    archivo = form.get("comprobante");
  } catch {
    return NextResponse.redirect(
      new URL("/sistema/compartido?error=lectura", req.url),
      303
    );
  }

  if (!(archivo instanceof File)) {
    return NextResponse.redirect(
      new URL("/sistema/compartido?error=sinarchivo", req.url),
      303
    );
  }

  try {
    const guardado = await guardarComprobante(archivo);
    const destino = new URL("/sistema/compartido", req.url);
    destino.searchParams.set("archivo", guardado.archivo);
    destino.searchParams.set("tipo", guardado.tipo);
    destino.searchParams.set("bytes", String(guardado.bytes));
    /*
      303 y no 302: obliga al navegador a pedir la página siguiente con
      GET. Con un 302 repetiría el POST, y al recargar se guardaría el
      mismo comprobante otra vez.
    */
    return NextResponse.redirect(destino, 303);
  } catch (e) {
    const destino = new URL("/sistema/compartido", req.url);
    destino.searchParams.set("error", (e as Error).message);
    return NextResponse.redirect(destino, 303);
  }
}
