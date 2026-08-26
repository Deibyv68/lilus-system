/**
 * Filtro de entrada. Corre antes que cualquier página o ruta.
 *
 * En Next 16 esto se llama `proxy.ts` — es el antiguo `middleware.ts`,
 * renombrado. Mismo comportamiento.
 *
 * ── La regla ──
 *
 * Cerrado por defecto. Lo que puede ver un desconocido está en
 * `ABIERTO_AL_PUBLICO` y en ningún otro lado. Se hace al revés — abrir
 * todo y cerrar lo delicado — y algún día se agrega una ruta nueva, nadie
 * se acuerda de cerrarla, y queda abierta sin que nadie lo note. Así no:
 * una ruta nueva nace cerrada, y si tiene que ser pública hay que decirlo.
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
 * Lo único que puede ver alguien sin sesión.
 *
 * `/api/agent` y `/api/print-queue` están abiertas a propósito: el agente
 * de impresión es un proceso en otra computadora, no un navegador. No
 * tiene cookies ni puede tenerlas — se identifica con `?token=`, que cada
 * una de esas rutas valida por su cuenta con `validateAgentToken`. Si se
 * las cierra aquí, la impresora deja de recibir trabajos.
 */
const ABIERTO_AL_PUBLICO = [
  "/login",
  "/api/agent",
  "/api/print-queue",
];

function esPublico(pathname: string): boolean {
  return ABIERTO_AL_PUBLICO.some(
    (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`)
  );
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (esPublico(pathname)) return NextResponse.next();

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
 * Hoy no hace falta porque nadie conoce la URL, pero el día que la tienda
 * viva en el mismo dominio, Google va a entrar a mirar. Que no encuentre
 * el panel es gratis y se agradece.
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
   * Cuando la tienda exista, sus rutas se agregan a ABIERTO_AL_PUBLICO
   * — no aquí. El matcher decide qué se revisa; la lista de arriba decide
   * qué se deja pasar. Mezclarlos es como se cuelan los agujeros.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|sw.js|manifest.webmanifest|brand/|uploads/).*)",
  ],
};
