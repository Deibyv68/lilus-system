import "server-only";
import { toBuffer } from "bwip-js/node";

/**
 * Genera un QR y lo devuelve listo para meter en un `<img src>`.
 *
 * Usa bwip-js, que ya estaba en el proyecto para los códigos de barras de
 * las etiquetas de envío. No hace falta ninguna librería nueva.
 *
 * Se devuelve como data URI en vez de servirlo desde una ruta: el QR pesa
 * unos 3 KB y va dentro del HTML de una página que de todos modos no se
 * cachea. Una ruta aparte serían dos viajes al servidor y un sitio más
 * donde equivocarse con los permisos.
 */
export async function qrComoDataUri(
  contenido: string,
  opciones: { escala?: number } = {}
): Promise<string | null> {
  const texto = contenido.trim();
  if (!texto) return null;

  try {
    /*
      Las mismas opciones que `generateBarcodePng`, que es lo que ya
      funciona en este proyecto para las etiquetas. `paddingwidth` y
      `paddingheight` en vez de `padding`, que los tipos no conocen.

      Se deja el nivel de corrección por defecto: subirlo exigiría una
      opción propia del simbolismo que estos tipos no aceptan, y para un
      QR que se muestra en pantalla —no impreso ni arrugado— el de fábrica
      sobra.
    */
    const png = await toBuffer({
      bcid: "qrcode",
      text: texto,
      scale: opciones.escala ?? 5,
      paddingwidth: 2,
      paddingheight: 2,
      backgroundcolor: "FFFFFF",
    });

    return `data:image/png;base64,${png.toString("base64")}`;
  } catch (e) {
    // Un QR que no sale no puede tumbar la página del pedido: el cliente
    // todavía tiene el número, el monto y los datos de la cuenta.
    console.error("[qr] No se pudo generar el código:", e);
    return null;
  }
}
