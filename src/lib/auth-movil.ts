import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/constants";

/**
 * El portero para la app de Android.
 *
 * ── Por qué no hay un login aparte ──
 *
 * La app usa las MISMAS filas de `Session` que el navegador. No hay un
 * segundo sistema de identidad, ni tokens de app, ni caducidades propias.
 * Lo único distinto es dónde viaja el token: el navegador lo manda en una
 * cookie, la app en una cabecera `Authorization: Bearer`.
 *
 * Eso importa por tres razones:
 *
 *   1. Cerrar la sesión de alguien desde el panel también lo saca de la
 *      app. Con dos sistemas habría que acordarse de cerrar los dos, y
 *      alguna vez no nos acordaríamos.
 *
 *   2. El WebView de la app puede llevar ese mismo token como cookie. Así
 *      las pantallas nativas y las pantallas web comparten una sola
 *      sesión: se entra una vez y todo queda abierto.
 *
 *   3. `getCurrentUser()` ya sabe caducar sesiones y rechazar usuarios
 *      desactivados. Reimplementarlo sería reimplementar esos bordes, que
 *      son justo los que se olvidan.
 *
 * ── Sobre mandar el token en una cabecera ──
 *
 * Una cookie viaja sola y por eso hace falta protegerla del CSRF. Una
 * cabecera hay que ponerla a propósito en cada petición, así que un sitio
 * de terceros no puede provocarla. Para una app es la forma correcta.
 */

export type UsuarioMovil = {
  id: string;
  username: string;
  name: string;
  role: string;
};

/**
 * Quién está pidiendo, o `null`.
 *
 * Mira primero la cabecera y después la cookie: así la misma ruta sirve
 * para la app y para una pestaña del navegador, sin duplicarla.
 */
export async function usuarioDePeticion(
  req: NextRequest
): Promise<UsuarioMovil | null> {
  const cabecera = req.headers.get("authorization") ?? "";
  const token = cabecera.toLowerCase().startsWith("bearer ")
    ? cabecera.slice(7).trim()
    : req.cookies.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  const sesion = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!sesion) return null;

  if (sesion.expiresAt < new Date()) {
    // Igual que en `getCurrentUser`: se limpia al pasar por aquí, para
    // que la tabla no se llene de sesiones muertas.
    await prisma.session.delete({ where: { id: sesion.id } });
    return null;
  }
  if (!sesion.user.isActive) return null;

  return {
    id: sesion.user.id,
    username: sesion.user.username,
    name: sesion.user.name,
    role: sesion.user.role,
  };
}

/** El rechazo estándar. Sin detalles: no le sirven a nadie que deba entrar. */
export function noAutorizado(): NextResponse {
  return NextResponse.json(
    { error: "No autorizado" },
    { status: 401, headers: { "cache-control": "no-store" } }
  );
}

/**
 * Envuelve un handler que necesita sesión.
 *
 * Existe para que la comprobación no se pueda olvidar: la ruta no recibe
 * al usuario hasta que hay uno. Con un `if` suelto al principio, la ruta
 * que se escriba mañana sin ese `if` compila igual de bien.
 */
export function conSesion<T>(
  handler: (req: NextRequest, usuario: UsuarioMovil, ctx: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ctx: T): Promise<NextResponse> => {
    const usuario = await usuarioDePeticion(req);
    if (!usuario) return noAutorizado();
    return handler(req, usuario, ctx);
  };
}

/** Respuesta JSON que ningún intermedio debe guardar. */
export function json(datos: unknown, status = 200): NextResponse {
  return NextResponse.json(datos, {
    status,
    headers: { "cache-control": "no-store" },
  });
}
