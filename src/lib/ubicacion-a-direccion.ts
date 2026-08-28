import { PROVINCIAS, cantonEntre } from "./ecuador";

/**
 * Qué hacer con la dirección cuando alguien marca un punto en el mapa.
 *
 * ── Por qué vive aquí y no dentro del checkout ──
 *
 * Esta lógica se escribió para la tienda y funcionaba bien: marcar un
 * punto rellenaba la calle, la provincia y el cantón. Al añadir el mapa a
 * los pedidos cargados a mano solo se copió la parte de las coordenadas,
 * y el resto se quedó sin hacer — así que en el panel el mapa guardaba un
 * punto y dejaba la provincia y la ciudad como estaban.
 *
 * Tenerlo en un solo sitio evita la siguiente versión de eso mismo. Y
 * sin dependencias, para poder probarlo: aquí es donde se decide qué
 * dirección se imprime en una etiqueta de envío.
 */

/**
 * Lo que devuelve el mapa. Se describe aquí en vez de importarlo del
 * componente porque ese arrastra Leaflet y su CSS, y entonces esto no se
 * podría ejecutar fuera de un navegador.
 */
export type PuntoElegido = {
  lat: number;
  lng: number;
  /** Lo que el mapa cree que es la calle. Puede venir vacío o mal. */
  calle?: string;
  /** Todos los nombres de lugar, del más pequeño al más grande. */
  lugares?: string[];
  provincia?: string;
  /** El código postal, si el mapa lo conoce. */
  postal?: string;
  /** Si el mapa llegó a contestar. Distinto de «contestó y no sabía». */
  recibioRespuesta?: boolean;
};

export type Direccion = {
  calle: string;
  provincia: string;
  /** El cantón. Se llama ciudad porque es como lo llama la gente. */
  ciudad: string;
  postal: string;
  lat: number | null;
  lng: number | null;
};

export type Resultado = {
  direccion: Direccion;
  /**
   * La calle que puso el mapa, para saber después si lo que hay escrito
   * lo escribió una persona o lo puso él.
   */
  calleDelMapa: string | null;
};

export function aplicarPunto(
  punto: PuntoElegido,
  previa: Direccion,
  calleDelMapa: string | null
): Resultado {
  const siguiente: Direccion = {
    ...previa,
    lat: punto.lat,
    lng: punto.lng,
  };

  /*
    El código postal se reemplaza solo si el mapa trae uno.

    Si el punto nuevo cae donde el mapa no lo conoce, dejar el anterior
    sería peor que dejarlo vacío: diría el postal de un sitio que ya no
    es. Pero tampoco se borra el que escribió una persona sin motivo, así
    que solo se pisa cuando hay algo mejor que poner.
  */
  if (punto.postal) siguiente.postal = punto.postal;
  else if (punto.recibioRespuesta && previa.postal) siguiente.postal = "";
  let nuevaCalleDelMapa = calleDelMapa;

  /*
    Cada punto nuevo reescribe la dirección que puso el mapa.

    Tres casos, y los tres importan:

    1. El mapa sabe la calle  → se pone, siempre. Quien mueve el marcador
       está diciendo «no, es acá».

    2. El mapa NO la sabe y lo que hay lo puso el mapa  → se borra.
       Dejarla sería peor que no tener nada: la dirección diría la calle
       del punto anterior, que puede estar a kilómetros.

    3. El mapa NO la sabe y lo que hay lo escribió la persona  → se
       respeta. El mapa no sabe más que ella sobre dónde vive.
  */
  if (punto.calle) {
    siguiente.calle = punto.calle;
    nuevaCalleDelMapa = punto.calle;
  } else if (
    punto.recibioRespuesta &&
    previa.calle &&
    previa.calle === calleDelMapa
  ) {
    siguiente.calle = "";
    nuevaCalleDelMapa = null;
  }

  if (punto.provincia) {
    const p = PROVINCIAS.find(
      (x) => x.nombre.toLowerCase() === punto.provincia!.toLowerCase()
    );
    /*
      Solo si cae en una provincia de la lista. Cerca de la frontera el
      mapa puede devolver una de Colombia o Perú, y esa no está — y una
      provincia que no existe aquí rompería el cálculo del envío.
    */
    if (p) {
      siguiente.provincia = p.nombre;
      /*
        El cantón sale de TODOS los nombres de lugar que devolvió el mapa,
        no del primero que suene a ciudad. En Tumbaco, el mapa manda
        «Tumbaco» como pueblo y «Distrito Metropolitano de Quito» como
        comarca: el cantón es el segundo.
      */
      const c = cantonEntre(p.nombre, punto.lugares ?? []);
      /*
        El cantón se limpia si el nuevo punto cayó en otra provincia:
        dejar «Quito» con la provincia ya cambiada a Manabí sería un dato
        imposible, y el servidor lo rechazaría al confirmar.
      */
      siguiente.ciudad = c ?? (p.nombre === previa.provincia ? previa.ciudad : "");
    }
  }

  return { direccion: siguiente, calleDelMapa: nuevaCalleDelMapa };
}
