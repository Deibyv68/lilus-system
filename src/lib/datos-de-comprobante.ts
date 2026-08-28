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
    /*
      Las palabras con las que cada banco anuncia la cifra.

      Son las de los seis o siete bancos que se ven aquí, y no una lista
      cerrada: cuando ninguna aparece, la cifra sigue contando —solo que
      con menos peso—. Así un banco nuevo con otra palabra no deja el
      monto en blanco, únicamente pierde el desempate.
    */
    const anuncia =
      /total|monto|valor|importe|transferi|enviad|recib|pagad|debitad|acreditad|exitosa|monto\s*enviado/i.test(
        linea
      );
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

/*
  Los meses, enteros y abreviados.

  Se listan porque «28 ago 2026» —lo que imprime el Banco General
  Rumiñahui— no encajaba en ningún patrón y la fecha salía vacía. Y se
  listan de verdad, en vez de buscar «tres letras seguidas de un año»,
  porque eso habría pillado también el «a las 15:01 horas» que va justo
  detrás en ese mismo comprobante.
*/
const MESES =
  "enero|febrero|marzo|abril|mayo|junio|julio|agosto|" +
  "septiembre|setiembre|octubre|noviembre|diciembre|" +
  "ene|feb|mar|abr|may|jun|jul|ago|sep|set|oct|nov|dic";

/**
 * La fecha, tal como la escribió el banco. No se interpreta ni se
 * convierte: se guarda para poder compararla de un vistazo con el
 * movimiento del estado de cuenta, y para eso lo que sirve es verla
 * igual que en la imagen.
 *
 * Los formatos van de más específico a más suelto, y el orden importa:
 * «2026-08-28» lleva dentro algo que parece «08-28», así que el patrón
 * con año de cuatro cifras tiene que probarse antes que el de barras.
 */
export function extraerFecha(texto: string): string | null {
  const patrones = [
    // 28 de agosto de 2026
    new RegExp(`\\b(\\d{1,2}\\s+de\\s+(?:${MESES})\\s+de\\s+\\d{4})\\b`, "i"),
    // 28 ago 2026 · 28 agosto 2026 · 28-ago-2026
    new RegExp(`\\b(\\d{1,2}[\\s-]+(?:${MESES})[\\s-]+\\d{4})\\b`, "i"),
    // 2026-08-28, el de los comprobantes que se generan en la web
    /\b(\d{4}-\d{1,2}-\d{1,2})\b/,
    // 28/08/2026 · 28-08-26
    /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/,
  ];

  for (const patron of patrones) {
    const m = patron.exec(texto);
    if (m) return m[1].trim();
  }
  return null;
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
  { nombre: "Banco Coopnacional", busca: /coopnacional/ },
  { nombre: "Banco del Litoral", busca: /del\s+litoral/ },
  { nombre: "Banco Comercial de Manabí", busca: /comercial\s+de\s+manabi/ },
  { nombre: "Banco Visionfund", busca: /visionfund/ },
  { nombre: "Banco D-MIRO", busca: /d-?miro/ },
  { nombre: "Banco del Austro", busca: /austro/ },
  { nombre: "Banco de Machala", busca: /machala/ },
  { nombre: "Banco de Loja", busca: /\bde\s+loja\b/ },
  { nombre: "BanEcuador", busca: /banecuador/ },
  { nombre: "Banco Solidario", busca: /solidario/ },
  { nombre: "Banco ProCredit", busca: /procredit/ },
  { nombre: "Banco Amazonas", busca: /amazonas/ },
  /*
    El nombre entero y la sigla. La app del banco se llama «BGR» y su
    cabecera dice eso, no el nombre largo — con la palabra suelta como
    frontera para que no lo dispare cualquier cadena que la contenga.
  */
  { nombre: "Banco General Rumiñahui", busca: /ruminahui|\bbgr\b/ },
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

/** Sin tildes y en minúscula: el OCR se come los acentos a menudo. */
function aplanar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ");
}

/** Todos los bancos nombrados en un texto, con dónde aparece cada uno. */
function bancosEn(plano: string): { nombre: string; donde: number }[] {
  const encontrados: { nombre: string; donde: number }[] = [];
  for (const banco of BANCOS) {
    const m = banco.busca.exec(plano);
    if (m) encontrados.push({ nombre: banco.nombre, donde: m.index });
  }
  return encontrados.sort((a, b) => a.donde - b.donde);
}

/*
  Cómo llama cada banco a las dos partes de una transferencia.

  «Desde», «Origen», «Ordenante» son quien paga. «Para», «Destino»,
  «Beneficiario» son quien cobra. Ninguna app las llama igual, pero
  todas usan alguna.
*/
const ORIGEN = /\b(desde|origen|ordenante|remitente|cuenta\s+de\s+debito|debitad)/;
const DESTINO = /\b(para|destino|beneficiari|acreditad|cuenta\s+de\s+credito)/;

/**
 * El banco DESDE el que se transfirió.
 *
 * ── Por qué no vale el primero que aparezca ──
 *
 * Era la regla anterior, con el argumento de que el banco de origen va
 * en la cabecera, con el logo. Se rompió con un comprobante real del
 * Banco General Rumiñahui: su cabecera es un logo dibujado, no texto,
 * así que el primer banco escrito era el del destinatario —«BANCO
 * PICHINCHA», dentro del bloque «Para»— y era eso lo que se guardaba.
 * Justo el contrario del dato que se busca.
 *
 * ── Lo que se hace ahora, en tres intentos ──
 *
 * 1. Buscar el bloque que dice «Desde» (u «Origen», «Ordenante»…) y
 *    quedarse con el banco nombrado ahí. Es la respuesta segura cuando
 *    el comprobante marca sus dos lados, que es lo normal.
 *
 * 2. Si no hay bloques marcados pero se nombran varios bancos, descartar
 *    los NUESTROS: el dinero llega a una cuenta de la casa, así que ese
 *    banco es el destino por definición. Lo que quede es de quien pagó.
 *
 * 3. Y si aun así hay dudas, el primero — que sigue acertando cuando el
 *    comprobante solo nombra uno, que es el caso más común de todos.
 *
 * Sale como propuesta y no como dato: quien revisa lo cambia con mirar
 * la imagen, que la tiene al lado.
 */
export function extraerBanco(
  texto: string,
  /**
   * Los bancos donde cobramos, para poder descartarlos.
   *
   * Se pasan desde fuera —salen de la configuración— para que esta
   * función siga sin tocar la base y se pueda probar sola.
   */
  misBancos: string[] = []
): string | null {
  const plano = aplanar(texto);
  const todos = bancosEn(plano);
  if (todos.length === 0) return null;
  if (todos.length === 1) return todos[0].nombre;

  // 1. El bloque de origen manda.
  const origen = ORIGEN.exec(plano);
  if (origen) {
    /*
      El bloque llega hasta la siguiente etiqueta de sección, o hasta el
      final. Sin ese corte, un «Desde» al principio se llevaría también
      el banco del bloque «Para» que viene después.
    */
    const desdeAqui = plano.slice(origen.index);
    const siguiente = DESTINO.exec(desdeAqui);
    const bloque =
      siguiente && siguiente.index > 0
        ? desdeAqui.slice(0, siguiente.index)
        : desdeAqui;

    const enElBloque = bancosEn(bloque);
    if (enElBloque.length > 0) return enElBloque[0].nombre;
  }

  // 2. Descartar los nuestros: el dinero entra en una cuenta de la casa.
  const mios = misBancos.map(aplanar).filter(Boolean);
  if (mios.length > 0) {
    const ajenos = todos.filter(
      (b) => !mios.some((mio) => aplanar(b.nombre) === mio)
    );
    if (ajenos.length > 0) return ajenos[0].nombre;
  }

  // 3. El primero, como antes.
  return todos[0].nombre;
}
