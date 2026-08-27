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
