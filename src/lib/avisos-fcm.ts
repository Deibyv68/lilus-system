import "server-only";
import { GoogleAuth } from "google-auth-library";
import { prisma } from "@/lib/prisma";

/**
 * Avisos para la app de Android, por Firebase Cloud Messaging.
 *
 * ── Por qué esto además del Web Push ──
 *
 * El Web Push de la PWA llega por la conexión que mantiene Chrome. En
 * teléfonos con MIUI, HyperOS o EMUI, el sistema mata a Chrome en segundo
 * plano con bastante alegría, y con él se va la conexión: el aviso no
 * llega hasta que alguien vuelve a abrir el navegador.
 *
 * La app tiene su propia conexión con Firebase, registrada a su nombre.
 * Se le pueden dar permisos y exención de batería como app, que es lo que
 * el sistema entiende. Por eso existen los dos caminos y no uno solo: son
 * transportes distintos para el mismo mensaje.
 *
 * ── Qué hace falta configurar ──
 *
 * Un proyecto de Firebase con Cloud Messaging, y su cuenta de servicio.
 * Eso lo tiene que crear una persona en la consola de Google — no es algo
 * que se pueda generar desde aquí. Del archivo JSON que descarga salen
 * las tres variables del `.env`:
 *
 *   FCM_PROJECT_ID=...
 *   FCM_CLIENT_EMAIL=...
 *   FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
 *
 * Sin ellas esto no manda nada y lo dice en el log, igual que el push web.
 * Un aviso que no sale no puede tumbar una venta.
 *
 * ── Sobre la clave privada y los saltos de línea ──
 *
 * En el JSON la clave viene con `\n` escritos como dos caracteres. Un
 * `.env` los guarda igual, así que hay que devolverlos a saltos de línea
 * reales antes de firmar. Si no, la firma falla con un error de OpenSSL
 * que no menciona ninguna de estas dos cosas.
 */

const PROJECT_ID = process.env.FCM_PROJECT_ID?.trim();
const CLIENT_EMAIL = process.env.FCM_CLIENT_EMAIL?.trim();
const PRIVATE_KEY = process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, "\n");

export function fcmConfigurado(): boolean {
  return Boolean(PROJECT_ID && CLIENT_EMAIL && PRIVATE_KEY);
}

/*
  Una sola instancia para todo el proceso.

  `GoogleAuth` guarda el token de acceso y lo renueva cuando le quedan
  pocos minutos. Crear una por aviso pediría un token nuevo cada vez:
  más lento, y una forma tonta de acercarse a los límites de Google.
*/
let auth: GoogleAuth | null = null;
function cliente(): GoogleAuth {
  if (!auth) {
    auth = new GoogleAuth({
      credentials: { client_email: CLIENT_EMAIL, private_key: PRIVATE_KEY },
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });
  }
  return auth;
}

export type AvisoApp = {
  titulo: string;
  cuerpo: string;
  /** A dónde lleva al tocarla, dentro de la app. */
  ruta?: string;
  /** Avisos con el mismo grupo se reemplazan en vez de apilarse. */
  grupo?: string;
};

/**
 * Manda el aviso a todos los teléfonos con la app.
 *
 * Devuelve a cuántos llegó. No lanza nunca: quien llama está guardando
 * un pedido.
 */
export async function avisarAppsMoviles(aviso: AvisoApp): Promise<number> {
  if (!fcmConfigurado()) {
    console.warn("[fcm] Sin credenciales de Firebase — no se mandó nada.");
    return 0;
  }

  const dispositivos = await prisma.dispositivoMovil.findMany();
  if (dispositivos.length === 0) {
    console.log("[fcm] No hay ningún teléfono registrado — no se mandó nada.");
    return 0;
  }

  let token: string | null | undefined;
  try {
    token = (await cliente().getAccessToken()) as string | null | undefined;
  } catch (e) {
    console.error("[fcm] No se pudo autenticar contra Google:", e);
    return 0;
  }
  if (!token) {
    console.error("[fcm] Google no devolvió token de acceso.");
    return 0;
  }

  const url = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

  const resultados = await Promise.allSettled(
    dispositivos.map(async (d) => {
      const respuesta = await fetch(url, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token: d.token,
            /*
              `notification` la pinta Android solo cuando la app está
              cerrada; `data` llega siempre y es lo que lee la app para
              saber a dónde navegar. Se mandan las dos.
            */
            notification: { title: aviso.titulo, body: aviso.cuerpo },
            data: {
              ruta: aviso.ruta ?? "/pedidos",
              grupo: aviso.grupo ?? "lilus",
            },
            android: {
              priority: "HIGH",
              notification: {
                // El canal lo crea la app al arrancar. Si el nombre no
                // coincide, Android usa el canal por defecto y el aviso
                // pierde el sonido que se le configuró.
                channel_id: "ventas",
                tag: aviso.grupo ?? "lilus",
                default_vibrate_timings: true,
              },
            },
          },
        }),
      });

      if (!respuesta.ok) {
        const detalle = await respuesta.text();
        const error = new Error(detalle) as Error & { estado?: number };
        error.estado = respuesta.status;
        throw error;
      }
      return true;
    })
  );

  const muertos: string[] = [];
  let entregados = 0;

  resultados.forEach((r, i) => {
    if (r.status === "fulfilled") {
      entregados++;
      return;
    }
    /*
      404 y 403 con UNREGISTERED significan que ese token ya no vale: la
      app se desinstaló o Firebase lo rotó. Se borran para que la tabla
      no se llene de destinos muertos a los que se escribe en cada venta.

      Los demás errores pueden ser pasajeros y se dejan en paz.
    */
    const razon = r.reason as Error & { estado?: number };
    const texto = razon?.message ?? "";
    if (razon?.estado === 404 || /UNREGISTERED|INVALID_ARGUMENT/.test(texto)) {
      muertos.push(dispositivos[i].token);
    } else {
      console.error("[fcm] No se pudo entregar:", razon?.estado, texto.slice(0, 200));
    }
  });

  if (muertos.length > 0) {
    await prisma.dispositivoMovil.deleteMany({
      where: { token: { in: muertos } },
    });
    console.log(`[fcm] ${muertos.length} token(s) caducado(s) borrado(s).`);
  }

  /*
    Se registra también cuando sale bien, y no solo cuando falla.

    El silencio era ambiguo: no saber si el aviso ni se intentó, o si se
    mandó y Firebase lo aceptó, deja el diagnóstico a ciegas justo cuando
    alguien dice «no me llegó nada». Una línea por venta no le hace daño
    a ningún log.

    Ojo con lo que significa «aceptado»: Firebase se hizo cargo del
    mensaje. Que además aparezca en la pantalla del teléfono depende del
    sistema —canal, permisos, y si el fabricante dejó viva la app— y eso
    ya no se ve desde aquí.
  */
  console.log(
    `[fcm] «${aviso.titulo}» → ${entregados} de ${dispositivos.length} ` +
      `aparato(s) aceptado(s) por Firebase.`
  );

  return entregados;
}
