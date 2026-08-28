import "server-only";
import sharp from "sharp";

/**
 * Preparar la imagen antes de leerla.
 *
 * ── El fallo que resuelve ──
 *
 * Un comprobante del Banco General Rumiñahui llegó y el sistema no sacó
 * el monto. Al mirar el texto crudo se entendió por qué: faltaba el
 * encabezado ENTERO. «BGR», «Transferencia Exitosa» y el «$280.00» son
 * blancos sobre un rectángulo azul, y Tesseract sencillamente no los
 * veía. Tampoco veía las etiquetas «Para» y «Desde», que son azules
 * sobre blanco.
 *
 * No es raro ni es de ese banco: casi todas las apps bancarias ponen el
 * monto en una franja de color, porque es lo que quieren que se vea. Es
 * decir, el dato más importante del comprobante es justo el que peor se
 * lee.
 *
 * ── Por qué gris y normalizada ──
 *
 * Tesseract decide qué es tinta y qué es papel comparando cada punto con
 * su entorno, y eso funciona mal cuando el rango de grises de la imagen
 * es estrecho: un azul medio y un blanco quedan demasiado cerca.
 * `normalize()` estira el histograma hasta ocupar de negro a blanco, y
 * con esa separación el texto claro sobre color aparece.
 *
 * Medido sobre el comprobante que falló: sin esto lee 9 líneas y se
 * pierde el monto; con esto lee 13, monto incluido.
 *
 * ── Y la segunda pasada ──
 *
 * Hay encabezados tan oscuros que ni estirando el contraste se separan.
 * Para esos se invierte la imagen —lo blanco se vuelve negro— y se lee
 * otra vez. Cuesta otros diez segundos en la laptop, así que solo se
 * hace cuando la primera pasada no encontró lo que importa.
 */

export type Preparada = { normal: Buffer; invertida: Buffer };

/*
  Un ancho mínimo para que las cifras pequeñas tengan puntos suficientes.

  Una captura de un teléfono viejo puede venir a 480 px de ancho, y ahí
  un «$280.00» mide diez píxeles de alto: ninguna cantidad de contraste
  lo salva. Ampliar antes de leer sí. No se reduce nunca — quitar puntos
  a una imagen grande solo la empeora.
*/
const ANCHO_MINIMO = 1000;

export async function prepararImagen(ruta: string): Promise<Preparada> {
  const base = sharp(ruta).rotate();
  const meta = await base.metadata();

  const ampliar =
    meta.width && meta.width < ANCHO_MINIMO
      ? { width: ANCHO_MINIMO }
      : undefined;

  const comun = () => {
    let s = sharp(ruta).rotate().grayscale();
    if (ampliar) s = s.resize(ampliar);
    return s;
  };

  const [normal, invertida] = await Promise.all([
    comun().normalize().toBuffer(),
    comun().negate().normalize().toBuffer(),
  ]);

  return { normal, invertida };
}
