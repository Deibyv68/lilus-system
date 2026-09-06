/**
 * El hueco que dejan los módulos nativos cuando la tienda va a la nube.
 *
 * `sharp`, `tesseract.js` y `pdf-to-png-converter` son binarios compilados
 * para una máquina concreta. En Cloudflare Workers no hay dónde ejecutar
 * eso, y el empaquetador ni siquiera sabe qué hacer con un archivo `.node`:
 * el build se cae antes de terminar.
 *
 * Los tres los usa solo el panel —leer el comprobante de pago que sube la
 * clienta, previsualizar etiquetas— y el panel no vive en la nube: vive en
 * la laptop, donde los binarios están y funcionan. Así que en el build de
 * la tienda se cambian por esto.
 *
 * No devuelve un valor falso ni se queda callado: lanza. Si algún día una
 * ruta de la tienda acaba llamando a uno de estos por descuido, queremos
 * un error que diga exactamente qué pasó, no una imagen en blanco ni un
 * comprobante leído como vacío.
 */

function ausente(nombre) {
  return () => {
    throw new Error(
      `[nativo-ausente] Se llamó a «${nombre}» en el despliegue de la tienda. ` +
        `Ese módulo solo existe en la laptop, donde corre el panel.`
    );
  };
}

export default ausente("default");
export const createWorker = ausente("createWorker");
export const pdfToPng = ausente("pdfToPng");
