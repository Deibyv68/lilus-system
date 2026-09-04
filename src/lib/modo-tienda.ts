/**
 * El interruptor de «aquí solo hay tienda».
 *
 * ── Para qué ──
 *
 * El plan es publicar la MISMA aplicación en dos sitios: en la laptop,
 * entera; y en la nube, solo la parte pública. Un solo repositorio, un
 * solo `git push`, dos despliegues.
 *
 * En el de la nube, el panel no debe existir. No «pedir contraseña»:
 * existir. Con la variable puesta, `/sistema` devuelve 404 igual que
 * cualquier dirección inventada, y quien la pruebe no se lleva ni la
 * confirmación de que hay algo ahí.
 *
 * ── Por qué la regla vive aquí y no en `proxy.ts` ──
 *
 * Porque `proxy.ts` importa cosas de Next y no se puede llamar desde un
 * script de pruebas. Esto es una función y una cadena: se prueba sola,
 * que es lo que hace falta cuando lo que decide es qué queda expuesto a
 * internet.
 */

/**
 * Lo único de `/api` que la tienda necesita.
 *
 * La página del pedido enseña el comprobante que la propia clienta
 * subió, y lo pide por aquí con el token de su pedido — ver
 * `pedido/[token]/subir-comprobante.tsx`. Esa ruta valida el token por su
 * cuenta, así que abrirla no abre nada más.
 *
 * Es la única. Todo lo demás bajo `/api` es panel, agente de impresión o
 * app de Android, y nada de eso pinta en la nube.
 */
const API_DE_LA_TIENDA = ["/api/comprobante"];

/** Lo que no es tienda ni por asomo. */
const NO_ES_TIENDA = ["/sistema", "/login"];

function empiezaPor(pathname: string, rutas: string[]): boolean {
  return rutas.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

/**
 * ¿Esta dirección queda fuera cuando solo se sirve la tienda?
 *
 * ── Por qué `/api` se bloquea por defecto ──
 *
 * Al revés que en `proxy.ts`, aquí NO se enumera lo que se cierra: se
 * enumera lo poco que se abre y se cierra el resto. Es a propósito.
 *
 * En el panel, olvidarse de proteger una ruta nueva la deja abierta a
 * quien tenga la dirección — malo, pero dentro de casa. Aquí el olvido
 * la deja abierta a internet entero. Cuando el coste de equivocarse no
 * es simétrico, la lista tiene que ir del lado que perdona: una ruta
 * nueva nace cerrada, y si de verdad la tienda la necesita, se nota
 * enseguida porque deja de funcionar.
 */
export function fueraDeLaTienda(pathname: string): boolean {
  if (empiezaPor(pathname, NO_ES_TIENDA)) return true;
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return !empiezaPor(pathname, API_DE_LA_TIENDA);
  }
  return false;
}

/**
 * Si este despliegue es solo la tienda.
 *
 * Se lee en cada petición y no una vez al cargar el módulo: el proxy de
 * Next 16 corre en Node, así que la variable es de verdad de tiempo de
 * ejecución y basta con reiniciar para cambiarla. Leerla cuesta nada.
 */
export function soloTienda(): boolean {
  const v = process.env.SOLO_TIENDA;
  return v === "1" || v === "true";
}
