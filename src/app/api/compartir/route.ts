import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/guard";
import { guardarComprobante } from "@/lib/comprobantes";
import { leerPunto, esEnlaceCorto } from "@/lib/punto-de-maps";

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
/*
  El destino va RELATIVO, y eso es a propósito.

  `NextResponse.redirect()` exige una dirección absoluta y la arma con
  `req.url`, que del lado del servidor es la interna —
  `https://localhost:3000/…`— aunque el teléfono haya pedido al dominio
  del túnel. El teléfono recibía eso, y para el teléfono «localhost» es
  el teléfono: conexión rechazada.

  Detrás hay un túnel —hoy Tailscale, mañana un dominio propio— así que
  el servidor no puede saber por qué nombre le llegó la petición sin
  fiarse de cabeceras que él no controla. Una `Location` relativa la
  resuelve el cliente contra la dirección que él mismo pidió, que es la
  correcta por definición.

  Es el mismo fallo que ya nos pasó en `api/movil/abrir`, y la misma
  cura. Que reaparezca dice que el atajo de `NextResponse.redirect()` es
  una trampa en este proyecto: aquí nada se sirve por su dirección real.
*/
function irA(ruta: string) {
  /*
    303 y no 302: obliga al navegador a pedir la página siguiente con
    GET. Con un 302 repetiría el POST, y al recargar se guardaría el
    mismo comprobante otra vez.
  */
  return new NextResponse(null, { status: 303, headers: { location: ruta } });
}

export async function POST(req: NextRequest) {
  /*
    Sin sesión no se guarda nada.

    Compartir abre la app instalada, que casi siempre tiene la sesión
    viva. Cuando no, se manda al login en vez de escribir un archivo que
    nadie ha pedido — esta ruta la puede invocar cualquier app del
    teléfono.
  */
  const usuario = await currentUser();
  if (!usuario) return irA("/login");

  let archivo: unknown;
  let texto = "";
  try {
    const form = await req.formData();
    archivo = form.get("comprobante");
    texto = [form.get("texto"), form.get("titulo")]
      .filter((v): v is string => typeof v === "string")
      .join(" ")
      .trim();
  } catch {
    return irA("/sistema/compartido?error=lectura");
  }

  /*
    Sin imagen, pero con un enlace de mapa: es una ubicación.

    Esta es la única forma que quedó de meter en el sistema la ubicación
    que una clienta manda por WhatsApp. WhatsApp no la comparte, pero al
    tocarla se abre en Google Maps, y desde Maps sí se comparte — como un
    enlace de texto, que es justo lo que este destino ya sabía recibir.

    Se comprueba antes que el «no llegó nada» para que un texto útil no
    termine en un mensaje de error.
  */
  if (!(archivo instanceof File) && texto) {
    if (leerPunto(texto) || esEnlaceCorto(texto)) {
      return irA(`/sistema/ubicacion?g=${encodeURIComponent(texto)}`);
    }
  }

  if (!(archivo instanceof File)) {
    return irA("/sistema/compartido?error=sinarchivo");
  }

  try {
    const guardado = await guardarComprobante(archivo);
    const parametros = new URLSearchParams({
      archivo: guardado.archivo,
      tipo: guardado.tipo,
      bytes: String(guardado.bytes),
    });
    return irA(`/sistema/compartido?${parametros}`);
  } catch (e) {
    const parametros = new URLSearchParams({ error: (e as Error).message });
    return irA(`/sistema/compartido?${parametros}`);
  }
}
