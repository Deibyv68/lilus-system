import "server-only";
import path from "node:path";
import { createWorker } from "tesseract.js";
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
  rutaAbsoluta: string
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

    const { data } = await worker.recognize(rutaAbsoluta);
    const texto = data.text ?? "";
    if (!texto.trim()) return null;

    return {
      monto: extraerMonto(texto),
      numero: extraerNumero(texto),
      fecha: extraerFecha(texto),
      banco: extraerBanco(texto),
      texto: texto.slice(0, 4000),
    };
  } catch (e) {
    console.error("[ocr] No se pudo leer el comprobante:", e);
    return null;
  } finally {
    await worker?.terminate().catch(() => {});
  }
}
