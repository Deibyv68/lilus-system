"use server";

import { requireUser } from "@/lib/guard";
import { leerPunto, esEnlaceCorto, type Punto } from "@/lib/punto-de-maps";
import { elegirTransversal } from "@/lib/vias";

/**
 * Convertir en coordenadas el enlace de Google Maps que mandó el cliente.
 *
 * ── Por qué hace falta el servidor ──
 *
 * Los enlaces que se comparten desde la app de Maps son cortos
 * (`maps.app.goo.gl/AbCdEf`) y no llevan las coordenadas dentro: hay que
 * seguirlos para que Google conteste con la dirección larga, que sí las
 * trae. Y eso no se puede hacer desde el navegador —otro dominio, sin
 * CORS— así que lo pide el servidor.
 *
 * Los enlaces largos se leen sin salir a la red. Aquí solo entran los
 * cortos.
 */

type Resultado =
  | { ok: true; punto: Punto; lugar: LugarDelPunto | null }
  | { ok: false; error: string };

/**
 * Lo que el mapa sabe de ese punto, además de sus coordenadas.
 *
 * Un enlace de Google Maps trae coordenadas y nada más. Sin esto, pegar
 * el enlace de una clienta dejaba el punto puesto y la provincia y la
 * ciudad como estaban — que es justo lo que se quería evitar al añadir
 * el mapa aquí. Se busca en el servidor y se devuelve junto al punto,
 * para que pegar un enlace haga lo mismo que tocar el mapa.
 */
export type LugarDelPunto = {
  /** «Principal y Secundaria», si se pudo averiguar la transversal. */
  calle: string;
  /** Del más pequeño al más grande. De aquí sale el cantón. */
  lugares: string[];
  provincia: string;
  postal: string;
};

/*
  La calle que cruza con la principal, preguntándole a Overpass.

  Es la misma idea que hace el mapa de la tienda desde el navegador. Aquí
  se hace en el servidor porque pegar un enlace no abre ningún mapa: sin
  esto, pegar daba «Avenida 24» y tocar el mapa daba «Avenida 24 y Calle
  15», para el mismo punto. Que dos caminos den direcciones distintas es
  peor que dar una peor: nadie sabría cuál creer.

  Si Overpass no contesta —tiene turnos y devuelve 429 cuando se acaban—
  se devuelve `null` y queda la principal sola. Es lo que había antes,
  así que no se pierde nada.
*/
async function transversalDe(
  punto: Punto,
  principal: string
): Promise<string | null> {
  if (!principal) return null;
  try {
    const consulta =
      `[out:json][timeout:15];` +
      `way(around:${RADIO_CRUCE},${punto.lat},${punto.lng})[highway][name];` +
      `out tags center;`;
    const r = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: new URLSearchParams({ data: consulta }),
      signal: AbortSignal.timeout(ESPERA_MAXIMA * 2),
    });
    if (!r.ok) return null;
    const j = await r.json();
    return elegirTransversal(j.elements ?? [], principal, punto.lat, punto.lng);
  } catch (e) {
    console.error("[maps] No se pudo buscar la transversal:", e);
    return null;
  }
}

/*
  Sesenta metros alrededor del punto. El mismo radio que usa el mapa de
  la tienda: más lejos empiezan a aparecer calles que no cruzan con esta.
*/
const RADIO_CRUCE = 60;

/*
  Los mismos campos que pide el mapa de la tienda, y en el mismo orden.

  Si aquí se pidieran otros, pegar un enlace y tocar el mapa darían
  cantones distintos para el mismo sitio — y nadie entendería por qué.
*/
async function lugarDe(punto: Punto): Promise<LugarDelPunto | null> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
        `&lat=${punto.lat}&lon=${punto.lng}&accept-language=es`,
      {
        headers: {
          accept: "application/json",
          /*
            Nominatim pide identificarse. Sin esto es legítimo que
            devuelva 403, y la búsqueda fallaría en silencio.
          */
          "user-agent": "LILUS/1.0 (panel de pedidos)",
        },
        signal: AbortSignal.timeout(ESPERA_MAXIMA),
      }
    );
    if (!r.ok) return null;

    const j = await r.json();
    const a = j.address ?? {};
    const road: string = a.road ?? "";
    const calle = [a.road, a.house_number].filter(Boolean).join(" ");

    /*
      La transversal se busca después de tener la principal, porque hace
      falta su nombre para descartarla de las candidatas.
    */
    const cruce = await transversalDe(punto, road);

    return {
      calle: cruce ? `${calle} y ${cruce}` : calle,
      postal: a.postcode ?? "",
      lugares: [
        a.city,
        a.town,
        a.municipality,
        a.county,
        a.state_district,
        a.village,
      ].filter((v: unknown): v is string => Boolean(v)),
      provincia: a.state ?? "",
    };
  } catch (e) {
    /*
      Que no se sepa el nombre del sitio no invalida el punto: las
      coordenadas ya sirven para repartir. Se devuelve `null` y la
      provincia y la ciudad se quedan como estaban.
    */
    console.error("[maps] No se pudo buscar el lugar:", e);
    return null;
  }
}

/*
  Cuánto se espera a Google antes de rendirse.

  Esto corre en una laptop con el internet de una casa. Sin tope, un
  enlace que no responde deja el formulario colgado sin decir nada, y
  quien lo abrió no sabe si esperar o volver a intentarlo.
*/
const ESPERA_MAXIMA = 8000;

export async function resolverEnlaceDeMapsAction(
  texto: string
): Promise<Resultado> {
  await requireUser();

  const limpio = (texto ?? "").trim();
  if (!limpio) return { ok: false, error: "Pega el enlace primero" };

  // Si ya trae las coordenadas dentro, no hace falta molestar a nadie.
  const directo = leerPunto(limpio);
  if (directo) return { ok: true, punto: directo, lugar: await lugarDe(directo) };

  if (!esEnlaceCorto(limpio)) {
    return {
      ok: false,
      error:
        "No reconozco ese enlace. Pega el de Google Maps, o marca el punto en el mapa.",
    };
  }

  /*
    Solo se sigue si la dirección es de Google.

    Sin esta comprobación, pegar cualquier cosa haría que el servidor
    saliera a pedirla — y un servidor que visita direcciones que le dicta
    quien escribe es la forma clásica de usarlo para llegar a sitios que
    solo él alcanza, como la propia red de casa.

    `esEnlaceCorto` ya mira el dominio, pero se comprueba otra vez sobre
    la URL ya parseada: una cadena puede parecer una cosa y resolverse a
    otra.
  */
  /*
    El enlace puede venir DENTRO de un texto.

    Google Maps no comparte la dirección sola: manda «Estación La
    Carolina» y debajo el enlace. Y quien pega a mano suele traerse la
    frase entera del chat. Intentar convertir todo eso en una URL falla,
    así que primero se saca el enlace de dentro.
  */
  const enElTexto = /https?:\/\/[^\s]+/i.exec(limpio);
  let url: URL;
  try {
    url = new URL(enElTexto ? enElTexto[0] : limpio);
  } catch {
    return { ok: false, error: "Ese enlace no se entiende" };
  }

  const dominiosPermitidos = ["maps.app.goo.gl", "goo.gl"];
  if (!dominiosPermitidos.includes(url.hostname)) {
    return { ok: false, error: "Ese enlace no es de Google Maps" };
  }

  try {
    const respuesta = await fetch(url.toString(), {
      // `manual` no basta: Google contesta con la larga en varios saltos.
      redirect: "follow",
      signal: AbortSignal.timeout(ESPERA_MAXIMA),
      headers: {
        /*
          Sin un navegador declarado, Google devuelve una página de
          consentimiento en vez del redireccionamiento.
        */
        "user-agent":
          "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36",
      },
    });

    /*
      Se mira la dirección final Y el cuerpo.

      A veces las coordenadas llegan en la URL a la que redirige, y a
      veces Google responde una página intermedia que las lleva dentro.
      Probar las dos cubre los dos casos sin tener que adivinar cuál toca.
    */
    const deLaUrl = leerPunto(respuesta.url);
    if (deLaUrl) return { ok: true, punto: deLaUrl, lugar: await lugarDe(deLaUrl) };

    const cuerpo = (await respuesta.text()).slice(0, 200_000);
    const delCuerpo = leerPunto(cuerpo);
    if (delCuerpo) {
      return { ok: true, punto: delCuerpo, lugar: await lugarDe(delCuerpo) };
    }

    return {
      ok: false,
      error: "Ese enlace no trae un punto. Marca la ubicación en el mapa.",
    };
  } catch (e) {
    console.error("[maps] No se pudo resolver el enlace:", e);
    return {
      ok: false,
      error: "No se pudo abrir el enlace. Marca el punto en el mapa.",
    };
  }
}
