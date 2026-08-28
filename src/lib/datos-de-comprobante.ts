/**
 * Sacar los datos útiles del texto de un comprobante.
 *
 * Vive aparte de `leer-comprobante.ts` porque ese importa `server-only` y
 * el motor de OCR, y eso impide ejecutarlo fuera de un servidor de React.
 * Aquí no hay dependencias, así que se puede probar con textos de
 * comprobantes reales — y es donde de verdad se equivoca la cosa: el
 * motor lee letras, la parte difícil es decidir cuál de los seis números
 * de la imagen es el monto.
 */

/**
 * El monto.
 *
 * Exportada para poder probarla con textos de comprobantes reales sin
 * pasar por el OCR: la parte que se equivoca es esta, no el motor.
 *
 * Se buscan todos los números con formato de dinero y se prefiere el que
 * está junto a una palabra que anuncia un total. Los comprobantes traen
 * varios números —comisión, saldo, número de cuenta— y quedarse con el
 * primero acierta por casualidad.
 *
 * Ecuador usa dólares y coma decimal en unos bancos y punto en otros, así
 * que se aceptan las dos y se normaliza.
 */
export function extraerMonto(texto: string): number | null {
  const candidatos: { valor: number; peso: number }[] = [];

  // `1.234,56` o `1,234.56` o `25,50` o `25.50`
  const patron = /(?:USD?\s*\$?|\$)\s*([\d.,]{1,15})|([\d]{1,3}(?:[.,]\d{3})*[.,]\d{2})(?!\d)/gi;
  const lineas = texto.split("\n");

  for (const linea of lineas) {
    const anuncia = /total|monto|valor|importe|transferi|enviado|pagado/i.test(linea);
    for (const m of linea.matchAll(patron)) {
      const crudo = (m[1] ?? m[2] ?? "").trim();
      if (!crudo) continue;

      /*
        Se decide cuál separador es el decimal por su posición: el último
        que aparezca, si deja exactamente dos cifras detrás, es la coma
        decimal. Así «1.234,56» y «1,234.56» dan lo mismo.
      */
      const ultimaComa = crudo.lastIndexOf(",");
      const ultimoPunto = crudo.lastIndexOf(".");
      const corte = Math.max(ultimaComa, ultimoPunto);

      let normal: string;
      if (corte >= 0 && crudo.length - corte - 1 === 2) {
        normal = crudo.slice(0, corte).replace(/[.,]/g, "") + "." + crudo.slice(corte + 1);
      } else {
        normal = crudo.replace(/[.,]/g, "");
      }

      const valor = Number(normal);
      if (!Number.isFinite(valor) || valor <= 0 || valor > 100000) continue;
      candidatos.push({ valor, peso: anuncia ? 2 : 1 });
    }
  }

  if (candidatos.length === 0) return null;

  // El de mayor peso; a igualdad, el mayor valor — el total suele serlo.
  candidatos.sort((a, b) => b.peso - a.peso || b.valor - a.valor);
  return candidatos[0].valor;
}

/**
 * El número de comprobante o de transacción.
 *
 * Se busca la etiqueta y se toma lo que venga detrás. Sin etiqueta no se
 * adivina: en un comprobante hay número de cuenta, cédula y teléfono, y
 * confundirlos sería peor que no tener nada — sobre todo porque este
 * número se usa para detectar duplicados.
 */
export function extraerNumero(texto: string): string | null {
  /*
    Se recorren TODAS las coincidencias, no solo la primera.

    «Comprobante de transaccion / Transaccion No. 4455667788» hacía que la
    primera coincidencia capturara la palabra «Transaccion» —once letras,
    que encajan igual de bien que un número— y la función se rendía ahí,
    devolviendo nada aunque el número estuviera dos palabras después.

    Ahora se prueban una tras otra y se devuelve la primera que parezca un
    número de verdad.
  */
  /*
    El `(?=[A-Z0-9-]*\d)` de delante de la captura no es adorno.

    Sin él, en «Comprobante de transaccion / Transaccion No. 4455667788»
    la primera coincidencia capturaba la palabra «Transaccion» —once
    letras, que encajan igual de bien que un número— y de paso se la
    comía, dejando fuera del alcance la etiqueta de verdad que venía
    justo después. El número quedaba sin encontrar aunque estuviera a dos
    palabras.

    Exigiendo que lo capturado contenga al menos un dígito, esa
    coincidencia falsa ni se llega a formar y el motor sigue buscando.
  */
  const etiquetas =
    /(?:n[úu]mero\s+de\s+)?(?:comprobante|transacci[óo]n|referencia|documento|operaci[óo]n|secuencial)\s*(?:n[°ºo.]{0,3})?\s*[:#]?\s*(?=[A-Z0-9-]*\d)([A-Z0-9-]{5,25})/gi;

  const plano = texto.replace(/\s+/g, " ");

  for (const m of plano.matchAll(etiquetas)) {
    const valor = m[1].trim().replace(/[.,;:]+$/, "");
    // Al menos cuatro dígitos: descarta un código corto o una fecha.
    if ((valor.match(/\d/g)?.length ?? 0) >= 4) return valor;
  }

  return null;
}

/** La fecha, tal como la escribió el banco. No se interpreta ni se convierte. */
export function extraerFecha(texto: string): string | null {
  const m =
    /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/.exec(texto) ??
    /\b(\d{1,2}\s+de\s+[a-záéíóú]+\s+de\s+\d{4})\b/i.exec(texto);
  return m ? m[1] : null;
}

/**
 * Los bancos y cooperativas que uno se encuentra en un comprobante
 * ecuatoriano, con lo que hay que buscar para reconocerlos.
 *
 * Se busca la palabra distintiva, nunca «banco»: «Produbanco» la lleva
 * dentro, y en la cabecera de cualquier comprobante aparece suelta.
 *
 * La lista no pretende ser completa —hay decenas de cooperativas— y no
 * pasa nada: lo que no está sale sin banco, y el banco se escribe a mano
 * al revisar. Es un atajo, no una fuente de verdad.
 */
const BANCOS: { nombre: string; busca: RegExp }[] = [
  { nombre: "Banco Pichincha", busca: /pichincha/ },
  { nombre: "Banco Guayaquil", busca: /guayaquil/ },
  { nombre: "Produbanco", busca: /produbanco/ },
  { nombre: "Banco del Pacífico", busca: /pacifico/ },
  { nombre: "Banco Internacional", busca: /internacional/ },
  { nombre: "Banco Bolivariano", busca: /bolivariano/ },
  { nombre: "Banco del Austro", busca: /austro/ },
  { nombre: "Banco de Machala", busca: /machala/ },
  { nombre: "Banco de Loja", busca: /\bde\s+loja\b/ },
  { nombre: "BanEcuador", busca: /banecuador/ },
  { nombre: "Banco Solidario", busca: /solidario/ },
  { nombre: "Banco ProCredit", busca: /procredit/ },
  { nombre: "Banco Amazonas", busca: /amazonas/ },
  { nombre: "Banco General Rumiñahui", busca: /ruminahui/ },
  { nombre: "Diners Club", busca: /diners/ },
  { nombre: "Banco Capital", busca: /banco\s+capital/ },
  { nombre: "Banco Delbank", busca: /delbank/ },
  { nombre: "Banco Finca", busca: /banco\s+finca/ },
  { nombre: "Cooperativa JEP", busca: /\bjep\b|juventud\s+ecuatoriana/ },
  { nombre: "Cooperativa Policía Nacional", busca: /policia\s+nacional/ },
  { nombre: "Cooperativa 29 de Octubre", busca: /29\s+de\s+octubre/ },
  { nombre: "Cooperativa Alianza del Valle", busca: /alianza\s+del\s+valle/ },
  { nombre: "Cooperativa Andalucía", busca: /andalucia/ },
  { nombre: "Cooprogreso", busca: /cooprogreso/ },
  { nombre: "Cooperativa Riobamba", busca: /coop\w*\s+riobamba|riobamba\s+ltda/ },
  { nombre: "Cooperativa San Francisco", busca: /san\s+francisco/ },
  { nombre: "Cooperativa Oscus", busca: /oscus/ },
  { nombre: "CACPECO", busca: /cacpeco/ },
  { nombre: "Cooperativa Mushuc Runa", busca: /mushuc/ },
  { nombre: "Cooperativa Daquilema", busca: /daquilema/ },
  { nombre: "Cooperativa Jardín Azuayo", busca: /jardin\s+azuayo/ },
  { nombre: "Cooperativa Vicentina", busca: /vicentina/ },
  /*
    DeUna y Peigo son billeteras, no bancos, pero es lo que dice el
    comprobante y es lo que quien pagó va a reconocer. Se escriben sin
    espacio a propósito: «de una» suelto aparece en cualquier frase.
  */
  { nombre: "DeUna", busca: /deuna|de\s?una!/ },
  { nombre: "Peigo", busca: /peigo/ },
];

/**
 * El banco desde el que se transfirió.
 *
 * Se devuelve el que aparezca ANTES en el texto. Un comprobante nombra
 * dos bancos —el de quien envía y el de quien recibe— y el de origen va
 * casi siempre en la cabecera, con el logo; el de destino aparece más
 * abajo, en los datos del beneficiario.
 *
 * Es una regla que acierta la mayoría de las veces y falla algunas, así
 * que sale como propuesta y no como dato: quien revisa lo cambia con
 * mirar la imagen, que la tiene al lado.
 */
export function extraerBanco(texto: string): string | null {
  // Sin tildes y en minúscula: el OCR se come los acentos a menudo.
  const plano = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");

  let mejor: { nombre: string; donde: number } | null = null;

  for (const banco of BANCOS) {
    const m = banco.busca.exec(plano);
    if (!m) continue;
    if (!mejor || m.index < mejor.donde) {
      mejor = { nombre: banco.nombre, donde: m.index };
    }
  }

  return mejor?.nombre ?? null;
}
