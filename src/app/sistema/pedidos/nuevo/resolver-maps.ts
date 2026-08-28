"use server";

import { requireUser } from "@/lib/guard";
import { leerPunto, esEnlaceCorto, type Punto } from "@/lib/punto-de-maps";

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
  | { ok: true; punto: Punto }
  | { ok: false; error: string };

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
  if (directo) return { ok: true, punto: directo };

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
  let url: URL;
  try {
    url = new URL(limpio);
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
    if (deLaUrl) return { ok: true, punto: deLaUrl };

    const cuerpo = (await respuesta.text()).slice(0, 200_000);
    const delCuerpo = leerPunto(cuerpo);
    if (delCuerpo) return { ok: true, punto: delCuerpo };

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
