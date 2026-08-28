/**
 * Sacar el número de guía de lo que traiga el código escaneado.
 *
 * ── Por qué no basta con lo leído tal cual ──
 *
 * Un código de barras de transportadora suele traer el número pelado,
 * pero un QR casi nunca: trae la dirección de la página de rastreo con el
 * número dentro, o un texto con varios campos separados. Guardar la
 * cadena entera dejaría en «Guía de envío» algo como
 * `https://servientrega.com.ec/rastreo?guia=1234567890`, que no se puede
 * leer por teléfono ni pegar en ninguna parte.
 *
 * ── Lo que se sabe y lo que no ──
 *
 * Los formatos exactos que imprime cada transportadora no están
 * documentados en ningún sitio público, y no tengo una etiqueta delante.
 * Así que esto no adivina un formato concreto: reconoce las tres formas
 * en que un número puede venir metido en un texto, y si no encuentra
 * ninguna creíble devuelve `null` — y entonces se escribe a mano, que es
 * lo que se hacía antes.
 *
 * Es aposta: preferir no leer nada a leer mal. Un número de guía
 * equivocado no falla aquí, falla dos días después, cuando la clienta
 * abre el enlace de rastreo y no encuentra su envío.
 */

/*
  Cuántos dígitos puede tener una guía.

  Servientrega usa alrededor de diez; otras transportadoras llegan a
  quince. Por debajo de seis ya no es una guía: es un código postal, un
  precio o un peso, de los que también viajan dentro de un QR.
*/
const MINIMO = 6;
const MAXIMO = 20;

function creible(digitos: string): boolean {
  return digitos.length >= MINIMO && digitos.length <= MAXIMO;
}

export function numeroDeGuia(crudo: string): string | null {
  const texto = (crudo ?? "").trim();
  if (!texto) return null;

  /*
    1. El número pelado. Es lo que trae un código de barras normal.

    Los guiones se quitan —van dentro de un mismo número— pero los
    espacios NO: separan. Quitándolos, «1234567890 9876543210» se
    convertía en un solo número de veinte dígitos que no es ninguno de
    los dos, y se guardaba tan tranquilo.
  */
  const pelado = texto.replace(/-/g, "");
  if (/^\d+$/.test(pelado) && creible(pelado)) return pelado;

  /*
    2. Detrás de una etiqueta que lo anuncia.

    Cubre tanto la dirección web (`?guia=123`) como el texto con campos
    (`GUIA:123;PESO:2`). Se prueba antes que buscar cifras sueltas
    porque, cuando la etiqueta está, es la respuesta segura.
  */
  const anunciado =
    /(?:gu[ií]a|guide|tracking|numero|n[uú]mero|awb|envio|env[ií]o)[^0-9a-z]{0,3}((?<!\d)\d{6,20}(?!\d))/i.exec(
      texto
    );
  if (anunciado && creible(anunciado[1])) return anunciado[1];

  /*
    3. La cifra más larga del texto.

    Último recurso, y solo si hay UNA sola candidata de longitud creíble.
    Con dos o más no hay forma de saber cuál es la guía —podría ser la
    fecha, el código de la sucursal o el valor declarado— y elegir la más
    larga acertaría unas veces y otras no. Ahí es mejor rendirse.
  */
  /*
    Con frontera a los dos lados: una cifra de veinticuatro dígitos no es
    «una de veinte seguida de cuatro», es una que no vale. Sin esto, un
    número absurdamente largo se recortaba a veinte y pasaba por bueno.
  */
  const candidatas = (texto.match(/(?<!\d)\d{6,20}(?!\d)/g) ?? []).filter(creible);
  const unicas = [...new Set(candidatas)];
  if (unicas.length === 1) return unicas[0];

  return null;
}
