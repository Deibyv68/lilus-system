/**
 * Filtro de entrada. Corre antes que cualquier página o ruta.
 *
 * En Next 16 esto se llama `proxy.ts` — es el antiguo `middleware.ts`,
 * renombrado. Mismo comportamiento.
 *
 * ── La regla ──
 *
 * La raíz es la tienda y la ve cualquiera. El panel vive bajo `/sistema`
 * y pide sesión. Son dos sitios distintos servidos por la misma app.
 *
 * Todo lo administrativo cuelga de UN prefijo a propósito: así la frontera
 * es una sola línea que se puede leer de un vistazo, en vez de una lista
 * de secciones que hay que acordarse de mantener. Una pantalla nueva del
 * panel nace protegida por estar donde está, no porque alguien se acordó
 * de agregarla a una lista.
 *
 * ── Lo que este archivo NO es ──
 *
 * No es la seguridad del sistema. Solo mira si la cookie de sesión existe;
 * no le pregunta a la base si sigue viva ni de quién es. La documentación
 * de Next lo dice sin rodeos: el proxy corre en cada petición, incluidas
 * las de prefetch, así que aquí no se consulta la base.
 *
 * O sea: una cookie vencida pasa por aquí. Y está bien que pase, porque
 * detrás está `guard.ts`, que sí pregunta. Esto es el filtro barato que
 * evita que el 99 % del ruido llegue siquiera a tocar la base.
 */

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, DEVICE_COOKIE } from "@/lib/constants";

/**
 * Lo que se revisa. Todo lo demás es tienda y se sirve a cualquiera.
 *
 * La regla se invirtió cuando el panel se mudó a `/sistema`: antes había
 * que enumerar lo poco que era público, ahora se enumera lo poco que es
 * privado. Es una lista mucho más corta y mucho más fácil de mirar y
 * decir «sí, eso es todo lo que hay que proteger».
 */
const REQUIERE_SESION = ["/sistema", "/api"];

/**
 * Excepciones dentro de `/api`.
 *
 * El agente de impresión es un proceso en otra computadora, no un
 * navegador. No tiene cookies ni puede tenerlas — se identifica con
 * `?token=`, que cada una de esas rutas valida por su cuenta con
 * `validateAgentToken`. Si se las cierra aquí, la impresora deja de
 * recibir trabajos.
 */
const CON_TOKEN_PROPIO = ["/api/agent", "/api/print-queue"];

function empiezaPor(pathname: string, rutas: string[]): boolean {
  return rutas.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (empiezaPor(pathname, CON_TOKEN_PROPIO)) return NextResponse.next();
  if (!empiezaPor(pathname, REQUIERE_SESION)) return NextResponse.next();

  // Chequeo optimista: ¿trae cookie de sesión? Si sí, que siga — quien
  // decide de verdad es `guard.ts`, ya con la base delante.
  if (req.cookies.has(SESSION_COOKIE)) {
    return sinIndexar(NextResponse.next());
  }

  // A una petición de API se le responde 401. Un redirect al login le
  // devolvería el HTML de una pantalla a un `fetch` que espera JSON, y el
  // error que vería el programador sería incomprensible.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // A una persona, en cambio, se la manda a la puerta que le toca: si ya
  // registró este dispositivo le alcanza el PIN, si no, usuario y clave.
  const destino = req.cookies.has(DEVICE_COOKIE) ? "/login/pin" : "/login";
  return NextResponse.redirect(new URL(destino, req.url));
}

/**
 * El sistema no se indexa. Nunca.
 *
 * La tienda vive en el mismo dominio y se quiere que Google la recorra
 * entera. Al hacerlo va a tropezar con /sistema. Que ahí encuentre un
 * cartel de «no me indexes» es gratis y evita que el panel termine
 * saliendo en una búsqueda.
 */
function sinIndexar(res: NextResponse) {
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  /*
   * Se excluyen los archivos que se sirven tal cual y no revelan nada:
   * los internos de Next, el logo de la marca, los íconos, el service
   * worker y los PDFs de etiqueta de `/uploads` (que son material de
   * producto, no datos de nadie).
   *
   * Las páginas de la tienda no hace falta excluirlas: entran, se ve que
   * no empiezan por /sistema ni por /api, y pasan de largo.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|sw.js|manifest.webmanifest|brand/|uploads/).*)",
  ],
};
