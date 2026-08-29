/**
 * Sacar unas coordenadas de lo que sea que llegue por WhatsApp.
 *
 * ── Por qué hace falta ──
 *
 * Media dirección en Ecuador no la encuentra nadie: «de las Alondras y de
 * los Quindes» describe un sitio real que ningún repartidor va a
 * localizar. Por eso quien compra en la web marca un punto en el mapa.
 *
 * Quien compra por WhatsApp no tiene ese mapa, pero sí hace lo mismo por
 * su cuenta: abre Google Maps, marca dónde vive y manda el enlace. Hasta
 * ahora ese enlace se quedaba en la conversación y la dueña volvía a
 * escribir las calles a mano — perdiendo justo el dato bueno.
 *
 * ── Las formas que llegan ──
 *
 * Google Maps genera media docena de formatos distintos según desde
 * dónde se comparta. Se aceptan todos los que traen las coordenadas
 * dentro, más el par suelto por si alguien las copia a pelo.
 *
 * Los enlaces cortos (`maps.app.goo.gl`) no las traen: hay que pedirle al
 * servidor que siga el redirección. Eso vive en la acción, no aquí —
 * este archivo no toca la red para poder probarse.
 */

export type Punto = { lat: number; lng: number };

/**
 * Ecuador continental y Galápagos, con margen.
 *
 * No es purismo geográfico: es la red que atrapa el error de verdad, que
 * es leer dos números de un enlace que no eran coordenadas —un
 * identificador, un zoom, un precio— y guardar una dirección en medio del
 * océano Índico sin que nada avise.
 */
function enEcuador(p: Punto): boolean {
  return p.lat >= -5.5 && p.lat <= 2.5 && p.lng >= -92.5 && p.lng <= -74.5;
}

function valido(lat: number, lng: number): Punto | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  const p = { lat, lng };
  return enEcuador(p) ? p : null;
}

/** ¿Es de los cortos, que hay que resolver pidiéndoselo al servidor? */
export function esEnlaceCorto(texto: string): boolean {
  return /(?:maps\.app\.goo\.gl|goo\.gl\/maps)\//i.test(texto.trim());
}

/**
 * Lee un punto de un enlace de Google Maps, o de un par de coordenadas.
 *
 * Devuelve `null` si no encuentra nada creíble. Nunca adivina: es mejor
 * pedir que lo marquen a mano que mandar un paquete a un punto inventado.
 */
export function leerPunto(texto: string): Punto | null {
  const t = (texto ?? "").trim();
  if (!t) return null;

  /*
    0. Una dirección `geo:`, que es lo que manda Android.

    Al tocar una ubicación en WhatsApp, el teléfono ofrece abrirla «con»
    otra app y le pasa un `geo:`. Va primero porque su formato es
    inequívoco: lo que hay detrás de los dos puntos son las coordenadas,
    sin adivinar nada.

    Dos formas: `geo:lat,lng` a secas, y `geo:0,0?q=lat,lng(Etiqueta)`,
    que es la que usan las apps cuando además quieren poner un nombre al
    punto. En la segunda las coordenadas buenas son las del `q=` — las de
    delante van en cero a propósito.
  */
  const geo = /^geo:/i.exec(t);
  if (geo) {
    const conEtiqueta = /[?&]q=(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/i.exec(t);
    if (conEtiqueta) {
      const p = valido(Number(conEtiqueta[1]), Number(conEtiqueta[2]));
      if (p) return p;
    }
    const directas = /^geo:(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/i.exec(t);
    if (directas) {
      const p = valido(Number(directas[1]), Number(directas[2]));
      if (p) return p;
    }
    return null;
  }

  /*
    El orden importa.

    Un mismo enlace puede traer varios pares de números, y no todos son el
    sitio: `/@-0.18,-78.47,17z` es dónde está la cámara, mientras que
    `!3d-0.18!4d-78.47` es el punto exacto del lugar. Cuando están los
    dos, el bueno es el segundo — la cámara puede estar desplazada.
  */

  // 1. `!3d<lat>!4d<lng>` — el sitio exacto, dentro del enlace largo.
  const exacto = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/.exec(t);
  if (exacto) {
    const p = valido(Number(exacto[1]), Number(exacto[2]));
    if (p) return p;
  }

  // 2. `?q=`, `?query=`, `?ll=`, `?destination=` — lo que ponen los enlaces
  //    que se generan «para compartir».
  const parametro =
    /[?&](?:q|query|ll|destination|center)=(-?\d+(?:\.\d+)?)%2C\s*(-?\d+(?:\.\d+)?)/i.exec(t) ??
    /[?&](?:q|query|ll|destination|center)=(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/i.exec(t);
  if (parametro) {
    const p = valido(Number(parametro[1]), Number(parametro[2]));
    if (p) return p;
  }

  // 3. `/@<lat>,<lng>,<zoom>z` — dónde estaba mirando la cámara.
  const camara = /\/@(-?\d+\.\d+),(-?\d+\.\d+)/.exec(t);
  if (camara) {
    const p = valido(Number(camara[1]), Number(camara[2]));
    if (p) return p;
  }

  /*
    4. Un par suelto: «-0.1807, -78.4678».

    Solo si el texto es ESO y nada más. Buscar dos números dentro de una
    frase encontraría el par equivocado en cuanto alguien pegue un enlace
    raro, y guardar mal una dirección no falla: manda el paquete a otro
    sitio y nadie se entera hasta que el cliente reclama.
  */
  const suelto = /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/.exec(t);
  if (suelto) {
    return valido(Number(suelto[1]), Number(suelto[2]));
  }

  return null;
}

/** El enlace a Google Maps de un punto, para abrirlo donde se reparte. */
export function enlaceDeMaps(p: Punto): string {
  return `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;
}
