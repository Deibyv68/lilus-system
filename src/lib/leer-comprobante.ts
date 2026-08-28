import "server-only";
import path from "node:path";
import { createWorker } from "tesseract.js";
import { prepararImagen } from "./imagen-comprobante";
import {
  extraerMonto,
  extraerNumero,
  extraerFecha,
  extraerBanco,
} from "./datos-de-comprobante";

/**
 * Leer un comprobante de pago con OCR.
 *
 * ── Lo que esto NO es ──
 *
 * No es una confirmación de pago, y ninguna parte del sistema debe
 * tratarlo como tal. Un comprobante es una imagen, y una imagen se edita
 * en dos minutos desde el teléfono. La única prueba de que el dinero
 * llegó es el estado de cuenta del banco, que mira una persona.
 *
 * Lo que sí resuelve, y no es poco:
 *
 *   · Comparar el monto de un vistazo, sin sumar ni entrecerrar los ojos.
 *   · Tener el número en texto, para pegarlo en el buscador del banco en
 *     vez de transcribirlo mirando una foto.
 *   · Encontrar el mismo comprobante usado en dos pedidos distintos, que
 *     es la estafa más común y la más fácil de detectar.
 *
 * ── Por qué Tesseract y no un modelo de visión ──
 *
 * El servidor es una laptop con un AMD E1-2100 y 3,3 GB de RAM: un chip
 * de gama baja de 2013. Cualquier modelo de visión, por pequeño que sea,
 * necesita varios gigas de memoria y un procesador de esta década. Ahí no
 * arranca, y en un VPS barato tampoco.
 *
 * Tesseract corre en ese hardware. Tarda entre cinco y quince segundos
 * por imagen, que es aceptable porque nadie está esperando: se lee
 * después de responder, con `after()`.
 *
 * ── Sobre la precisión ──
 *
 * Una captura de pantalla de una app bancaria —texto negro sobre blanco,
 * tipografía limpia— se lee bien. Una foto de la pantalla del celular con
 * reflejos y torcida, mucho peor. Por eso todo lo que devuelve es
 * opcional y todo lo que se muestra va como «el comprobante dice», nunca
 * como un hecho.
 */

export type LecturaDeComprobante = {
  monto: number | null;
  numero: string | null;
  fecha: string | null;
  banco: string | null;
  texto: string;
};

/*
  Dónde guarda Tesseract sus datos de idioma.

  Son unos 15 MB que se descargan la primera vez. Sin una ruta fija los
  bajaría al directorio de trabajo, que cambia entre el desarrollo y el
  servicio de systemd — y volvería a descargarlos en cada despliegue,
  desde una laptop con el internet de una casa.
*/
const CACHE = path.join(process.cwd(), ".tesseract");

/**
 * Lee un archivo de comprobante.
 *
 * Devuelve `null` si no se pudo leer nada — un OCR que falla no puede
 * impedir que el comprobante exista, que es lo que de verdad importa.
 */
export async function leerComprobanteConOcr(
  rutaAbsoluta: string,
  /**
   * Los bancos donde cobramos.
   *
   * Sirven para descartarlos al decidir de qué banco vino el pago: el
   * dinero llega a una cuenta de la casa, así que ese banco es el
   * destino por definición. Ver `extraerBanco`.
   */
  misBancos: string[] = []
): Promise<LecturaDeComprobante | null> {
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;

  try {
    /*
      Español e inglés a la vez: los bancos ecuatorianos mezclan. Un
      «Transaction successful» en medio de un comprobante en español es
      lo normal, y con un solo idioma esas líneas salen ilegibles.
    */
    worker = await createWorker(["spa", "eng"], undefined, {
      cachePath: CACHE,
      // El progreso no interesa: esto corre sin nadie mirando.
      logger: () => {},
    });

    /*
      La imagen se prepara antes de leerla.

      Sin esto, Tesseract no ve el texto claro sobre las franjas de color
      que casi todas las apps bancarias usan para el monto — que es
      justamente el dato que más importa. Ver `imagen-comprobante.ts`.
    */
    const imagen = await prepararImagen(rutaAbsoluta);

    const { data } = await worker.recognize(imagen.normal);
    let texto = data.text ?? "";

    /*
      Segunda pasada, con la imagen invertida, solo si hizo falta.

      Hay encabezados tan oscuros que ni estirando el contraste sueltan
      su texto. Invertir los saca, pero cuesta otros diez segundos en
      esta laptop, así que solo se paga cuando la primera pasada no
      encontró el monto — que es la señal de que se perdió una franja.

      Se queda el texto más largo de los dos: no se mezclan. Pegar dos
      lecturas del mismo comprobante duplicaría las cifras y volvería
      ambiguo justo lo que hay que decidir.
    */
    if (!extraerMonto(texto)) {
      const segunda = await worker.recognize(imagen.invertida);
      const otro = segunda.data.text ?? "";
      if (extraerMonto(otro) || otro.length > texto.length) texto = otro;
    }

    if (!texto.trim()) return null;

    return {
      monto: extraerMonto(texto),
      numero: extraerNumero(texto),
      fecha: extraerFecha(texto),
      banco: extraerBanco(texto, misBancos),
      texto: texto.slice(0, 4000),
    };
  } catch (e) {
    console.error("[ocr] No se pudo leer el comprobante:", e);
    return null;
  } finally {
    await worker?.terminate().catch(() => {});
  }
}
