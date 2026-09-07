import "server-only";

/**
 * Envío de correo.
 *
 * ── La regla de oro ──
 *
 * Un correo que no sale NUNCA puede tumbar un pedido. Para cuando se manda
 * el correo, la persona ya llenó el formulario, ya vio su número de pedido
 * y ya está mirando cómo transferir. Si en ese momento se cae el servidor
 * de correo y dejamos que la excepción suba, la compra revienta después de
 * hecha: la peor forma posible de fallar.
 *
 * Por eso todo acá devuelve un booleano y nada lanza. Lo que falla se
 * anota en el log del servidor y la vida sigue: el pedido está guardado,
 * que es lo que importa. Se avisa a mano y ya.
 *
 * ── Dos formas de mandarlo, y por qué se prefiere la de arriba ──
 *
 * Por HTTP contra la API de Resend, o por SMTP con nodemailer.
 *
 * Se prefiere HTTP siempre que haya clave, incluso en la laptop donde
 * SMTP funciona perfectamente. El motivo no es que sea mejor: es que
 * Cloudflare Workers no puede abrir una conexión SMTP, y ahí es donde va
 * a vivir la tienda. Si la laptop mandara por SMTP y la nube por HTTP,
 * el camino que corre en producción sería justo el que nunca probamos.
 * Un solo camino, ejercitado todos los días.
 *
 * SMTP se queda para quien configure un servidor que no sea Resend.
 * Se carga solo si se usa: nodemailer es código de Node y no tiene nada
 * que hacer dentro del paquete que se sube a la nube.
 *
 * ── Configuración ──
 *
 * Se configura por variables de entorno. Si no están, el sistema no se
 * rompe: no manda nada y lo dice en el log. Eso permite trabajar en local
 * sin cuenta de correo, y permite que la tienda funcione desde el primer
 * día aunque el correo se configure la semana que viene.
 *
 *   RESEND_API_KEY=re_...            # el camino preferido
 *   MAIL_FROM="LILUS <contacto@liluscare.com>"
 *   MAIL_ADMIN=...                   # a dónde llegan los avisos de venta
 *
 * O, para un servidor cualquiera:
 *
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=587
 *   SMTP_USER=tucorreo@gmail.com
 *   SMTP_PASS=<contraseña de aplicación, NO la del correo>
 *   MAIL_FROM="LILUS <tucorreo@gmail.com>"
 *   MAIL_ADMIN=tucorreo@gmail.com   # a dónde llegan los avisos de venta
 *
 * Con Gmail hay que generar una «contraseña de aplicación» en la cuenta de
 * Google; la contraseña normal no sirve y además nunca debería andar
 * escrita en un archivo.
 */

type Adjunto = {
  nombre: string;
  contenido: Uint8Array;
  tipo: string;
};

type Mensaje = {
  para: string;
  asunto: string;
  html: string;
  texto: string;
  /*
    Lo que va pegado al correo.

    Opcional a propósito: un adjunto que no se pudo armar no debe impedir
    que salga el aviso. Quien llama pasa la lista si la tiene y no la pasa
    si no, y el correo sale igual con el enlace dentro.
  */
  adjuntos?: Adjunto[];
};

function configuracionSmtp() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  return {
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    // 465 es el puerto que va cifrado desde el saludo inicial. En 587 la
    // conexión empieza en claro y sube a TLS con STARTTLS, que nodemailer
    // hace solo.
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: { user, pass },
    remitente: process.env.MAIL_FROM ?? `LILUS <${user}>`,
  };
}

/**
 * La clave de la API de Resend, si la hay.
 *
 * Acepta que llegue como `SMTP_PASS` cuando el servidor configurado es el
 * de Resend, y no es un truco: al usar Resend por SMTP, la contraseña ES
 * la clave de la API, la misma cadena `re_...`. Reconocerla evita tener
 * el mismo secreto escrito dos veces en el mismo archivo, que es como
 * empiezan las rotaciones a medias.
 */
function claveDeResend(): string | null {
  const directa = process.env.RESEND_API_KEY?.trim();
  if (directa) return directa;

  const host = process.env.SMTP_HOST?.trim().toLowerCase() ?? "";
  const pass = process.env.SMTP_PASS?.trim();
  if (host.endsWith("resend.com") && pass?.startsWith("re_")) return pass;

  return null;
}

function remitente(): string {
  return process.env.MAIL_FROM ?? `LILUS <${process.env.SMTP_USER ?? "no-reply"}>`;
}

/**
 * Bytes a base64, sin depender de `Buffer`.
 *
 * `Buffer` existe en Node y también en Workers con la compatibilidad
 * encendida, pero esto son seis líneas y no dependen de que esa
 * compatibilidad siga encendida dentro de un año.
 *
 * Va por trozos porque `String.fromCharCode` con un array de varios
 * megas revienta la pila, y los comprobantes en PDF pesan lo suyo.
 */
function aBase64(bytes: Uint8Array): string {
  let binario = "";
  const TROZO = 0x8000;
  for (let i = 0; i < bytes.length; i += TROZO) {
    binario += String.fromCharCode(...bytes.subarray(i, i + TROZO));
  }
  return btoa(binario);
}

export function correoDeAdmin(): string | null {
  return process.env.MAIL_ADMIN ?? process.env.SMTP_USER ?? null;
}

export function correoConfigurado(): boolean {
  return claveDeResend() !== null || configuracionSmtp() !== null;
}

/**
 * Manda un correo. Devuelve si salió.
 *
 * No lanza nunca. Ver la nota de arriba.
 */
export async function enviarCorreo(m: Mensaje): Promise<boolean> {
  const clave = claveDeResend();
  if (clave) return porHttp(m, clave);

  const cfg = configuracionSmtp();
  if (cfg) return porSmtp(m, cfg);

  console.warn(
    `[correo] Sin configurar (falta RESEND_API_KEY o SMTP_HOST/USER/PASS). No se envió «${m.asunto}» a ${m.para}.`
  );
  return false;
}

/** Por la API de Resend. El camino que también funciona en la nube. */
async function porHttp(m: Mensaje, clave: string): Promise<boolean> {
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: remitente(),
        to: [m.para],
        subject: m.asunto,
        html: m.html,
        text: m.texto,
        attachments: m.adjuntos?.map((a) => ({
          filename: a.nombre,
          content: aBase64(a.contenido),
          content_type: a.tipo,
        })),
      }),
    });

    if (!r.ok) {
      /*
        El cuerpo del error dice qué pasó —dominio sin verificar, clave
        revocada, destinatario rechazado— y sin él solo queda un número.
        Se lee entero: son unos cientos de bytes y es lo único que va a
        haber cuando alguien pregunte por qué no llegó un correo.
      */
      console.error(
        `[correo] Resend rechazó «${m.asunto}» a ${m.para}: ${r.status} ${await r.text()}`
      );
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[correo] No salió «${m.asunto}» a ${m.para}:`, e);
    return false;
  }
}

/** Por SMTP, para un servidor que no sea Resend. Solo corre en la laptop. */
async function porSmtp(
  m: Mensaje,
  cfg: NonNullable<ReturnType<typeof configuracionSmtp>>
): Promise<boolean> {
  try {
    /*
      Se carga aquí y no arriba a propósito: nodemailer es código de Node,
      y cargándolo arriba viajaría dentro del paquete que se sube a
      Cloudflare aunque allí no se pueda usar.
    */
    const { default: nodemailer } = await import("nodemailer");

    const transporte = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: cfg.auth,
    });

    await transporte.sendMail({
      from: cfg.remitente,
      to: m.para,
      subject: m.asunto,
      text: m.texto,
      html: m.html,
      attachments: m.adjuntos?.map((a) => ({
        filename: a.nombre,
        content: Buffer.from(a.contenido),
        contentType: a.tipo,
      })),
    });
    return true;
  } catch (e) {
    console.error(`[correo] No salió «${m.asunto}» a ${m.para}:`, e);
    return false;
  }
}

/**
 * El sobre de todos los correos de LILUS.
 *
 * ── Por qué esto parece HTML de 2005 ──
 *
 * Porque es lo único que se ve igual en todas partes. Gmail borra las
 * hojas de estilo, Outlook sigue maquetando con tablas y varios clientes
 * ignoran la mitad de CSS moderno. Todo va en línea y en tablas de una
 * columna a propósito: lo que aquí parece anticuado es lo que hace que el
 * correo llegue entero al teléfono de una clienta.
 *
 * ── El modo oscuro ──
 *
 * Gmail y Outlook invierten los colores por su cuenta cuando el teléfono
 * está en oscuro, y lo hacen mal: un fondo declarado y un texto sin
 * declarar terminan en gris sobre gris. Por eso CADA bloque lleva su
 * fondo y su color escritos, aunque parezca repetido. Es la diferencia
 * entre un correo legible y uno que hay que seleccionar con el dedo para
 * poder leerlo.
 *
 * ── El pie ──
 *
 * Lleva a quién escribir. Un correo automático sin una forma de responder
 * es un callejón sin salida, y quien acaba de pagar por internet a un
 * negocio pequeño quiere ver que hay alguien al otro lado.
 */
export function plantilla(
  titulo: string,
  cuerpo: string,
  opciones: { entradilla?: string; pie?: string } = {}
): string {
  const entradilla = opciones.entradilla
    ? `<p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#57534e">${opciones.entradilla}</p>`
    : "";

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background:#f5f4f2;color:#1c1917;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">
  <!-- La entradilla que asoma en la lista del correo, antes de abrirlo. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${opciones.entradilla ?? titulo}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f4f2;padding:28px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">

          <tr>
            <td style="padding:0 4px 18px">
              <span style="font-size:20px;font-weight:700;letter-spacing:.14em;color:#1c1917">LILUS</span>
              <span style="font-size:12px;color:#a8a29e;padding-left:8px">jabones artesanales</span>
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;border:1px solid #e7e5e4;border-radius:14px;padding:30px 26px">
              <h1 style="margin:0 0 14px;font-size:21px;line-height:1.3;font-weight:600;color:#1c1917">${titulo}</h1>
              ${entradilla}
              ${cuerpo}
            </td>
          </tr>

          <tr>
            <td style="padding:20px 6px 0;font-size:12px;line-height:1.75;color:#a8a29e">
              ${opciones.pie ?? ""}
              <p style="margin:10px 0 0">Este correo salió solo, porque se movió tu pedido en la tienda de LILUS.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Un botón que se ve como un botón en Outlook también.
 *
 * Outlook no pinta `border-radius` ni respeta el relleno de un `<a>`, así
 * que el botón se arma con una tabla de una celda. Es feo por dentro y es
 * la única forma de que se vea igual en los dos sitios.
 */
export function boton(texto: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 0">
    <tr><td style="background:#1c1917;border-radius:999px">
      <a href="${url}" style="display:inline-block;padding:13px 26px;font-size:14px;font-weight:500;color:#fafaf9;text-decoration:none">${texto}</a>
    </td></tr>
  </table>`;
}
