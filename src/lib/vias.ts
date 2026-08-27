/**
 * Elegir la calle transversal entre las que devuelve Overpass.
 *
 * Vive aparte del componente del mapa por una razón práctica: ese archivo
 * importa la hoja de estilos de Leaflet, y eso impide ejecutarlo fuera de
 * un navegador. Aquí, sin dependencias, se puede probar con respuestas de
 * mentira — que es justo lo que hacía falta, porque el fallo estuvo en
 * esta lógica y no había forma de verlo sin red.
 */

export type ViaCercana = {
  tags?: { name?: string };
  center?: { lat: number; lon: number };
};

/**
 * De las vías que devolvió Overpass, cuál es la transversal.
 *
 * Está separada de la petición para poder probarla sin red — que es
 * justamente donde estuvo el fallo: el filtro exigía `center` y, cuando
 * Overpass no lo mandaba, descartaba todas las calles y devolvía `null`
 * sin dejar rastro. Un filtro que descarta todo es peor que no filtrar,
 * y sin poder ejecutarlo con una respuesta de mentira no había forma de
 * verlo.
 *
 * Lo único obligatorio es el nombre. El centro sirve para ordenar por
 * cercanía cuando viene; cuando no, se respeta el orden recibido.
 */
export function elegirTransversal(
  elementos: ViaCercana[],
  principal: string,
  lat: number,
  lng: number
): string | null {
  const normal = (t: string) => t.trim().toLowerCase();

  const cerca = elementos
    .filter((e) => e.tags?.name)
    .map((e) => ({
      nombre: e.tags!.name!,
      // Distancia aproximada en metros, o infinito si no vino el centro:
      // así las que no lo traen quedan al final sin salir de la lista.
      d: e.center
        ? Math.hypot(
            (e.center.lat - lat) * 111320,
            (e.center.lon - lng) * 111320 * Math.cos((lat * Math.PI) / 180)
          )
        : Number.POSITIVE_INFINITY,
    }))
    .filter((v) => normal(v.nombre) !== normal(principal))
    .sort((a, b) => a.d - b.d);

  return cerca[0]?.nombre ?? null;
}

