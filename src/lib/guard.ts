/**
 * El portero. Un solo lugar donde se decide quién puede entrar.
 *
 * ── Por qué existe ──
 *
 * Hasta ahora la única puerta era el `redirect()` del layout de `(app)`.
 * Eso protege las páginas, pero una app de Next tiene más de una entrada:
 * las server actions son endpoints POST de verdad y las rutas de API se
 * responden solas. Ninguna de las dos pasa por el layout, así que ninguna
 * de las dos estaba protegida.
 *
 * Mientras la URL era una dirección aleatoria de trycloudflare eso no se
 * notaba. Con la tienda pública encima y un dominio propio, la dirección
 * deja de ser el secreto — y entonces el único secreto que queda es la
 * sesión. De ahí que la verificación tenga que estar pegada al dato, no
 * a la pantalla.
 *
 * ── Cómo se usa ──
 *
 * - En una server action:  `await requireUser()` en la primera línea.
 * - En una ruta de API:    `const no = await denyIfAnonymous(); if (no) return no;`
 *
 * El chequeo del `proxy.ts` NO reemplaza a estos: ese solo mira si la
 * cookie existe, sin preguntarle a la base si sigue viva. Es un filtro
 * barato de primera línea. La verdad se decide aquí.
 */

import { cache } from "react";
import { NextResponse } from "next/server";
import { getCurrentUser } from "./auth";

/**
 * La sesión del que está pidiendo, o null.
 *
 * Va envuelto en `cache` de React para que una página que llama al portero
 * cinco veces consulte la base una sola. La memoria dura lo que dura la
 * petición: no hay riesgo de servirle a alguien la sesión de otro.
 */
export const currentUser = cache(getCurrentUser);

/** Lo que se le dice a quien no tiene sesión. Sin detalles: no ayuda a nadie. */
const NO_ENTRA = "No autorizado. Inicia sesión para continuar.";
const NO_ES_ADMIN = "Solo un administrador puede hacer esto.";

/**
 * Exige sesión válida. Para server actions.
 *
 * Lanza en vez de redirigir a propósito: una server action puede venir de
 * un `fetch` que no sabe qué hacer con el HTML de una pantalla de login.
 * Lanzando, la acción se corta y el error sube al cliente como error.
 */
export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new Error(NO_ENTRA);
  return user;
}

/** Exige, además, que sea administrador. */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error(NO_ES_ADMIN);
  return user;
}

/**
 * Para rutas de API: devuelve la respuesta de rechazo, o `null` si puede pasar.
 *
 * Se usa así, y la forma importa:
 *
 *     const denegado = await denyIfAnonymous();
 *     if (denegado) return denegado;
 *
 * Devolver la respuesta en lugar de lanzarla obliga a escribir el `return`,
 * que es justo lo que hace que el guardia no se pueda olvidar a medias.
 */
export async function denyIfAnonymous(): Promise<NextResponse | null> {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
