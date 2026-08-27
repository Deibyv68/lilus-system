import { NextRequest, NextResponse } from "next/server";
import { conSesion } from "@/lib/auth-movil";
import { SESSION_COOKIE } from "@/lib/constants";
import { SESSION_DAYS } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * El puente entre la app y el WebView.
 *
 * ── El problema ──
 *
 * La app guarda el token de sesión y lo manda en una cabecera. El panel
 * web, en cambio, lee una cookie — y esa cookie es `httpOnly`, o sea que
 * el JavaScript del WebView no puede escribirla. Sin esto, la persona
 * entraría en la app y le tocaría volver a entrar al abrir el panel.
 *
 * ── La solución ──
 *
 * El WebView carga esta ruta UNA vez, con la cabecera `Authorization`
 * puesta en la petición inicial. Aquí se valida el token, se planta la
 * cookie de sesión y se redirige al panel. De ahí en adelante el WebView
 * navega con su cookie como cualquier navegador.
 *
 * ── Por qué no va el token en la URL ──
 *
 * Porque una URL se guarda en el historial, en los logs del servidor y en
 * los de cualquier proxy que haya en medio. Un token de sesión que dura
 * semanas no puede vivir en un sitio así. La cabecera solo existe durante
 * esa petición.
 *
 * La cookie que se planta es exactamente la misma que pone el login web
 * —mismos flags, misma duración, misma fila de `Session`— porque es la
 * misma sesión vista desde otro lado.
 */
export const GET = conSesion(async (req: NextRequest) => {
  const destinoCrudo = new URL(req.url).searchParams.get("ir") ?? "/sistema";

  /*
    Solo rutas internas.

    Sin este filtro, `?ir=https://otro-sitio` convertiría esta ruta en un
    redirector abierto: alguien podría mandar un enlace que empieza en tu
    dominio y termina donde él quiera, y el candado del navegador diría
    que todo está bien.
  */
  const destino =
    destinoCrudo.startsWith("/") && !destinoCrudo.startsWith("//")
      ? destinoCrudo
      : "/sistema";

  const token = (req.headers.get("authorization") ?? "").slice(7).trim();

  const respuesta = NextResponse.redirect(new URL(destino, req.url));
  respuesta.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return respuesta;
});
