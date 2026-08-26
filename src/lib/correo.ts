import "server-only";
import nodemailer from "nodemailer";

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
 * ── Configuración ──
 *
 * Se configura por variables de entorno. Si no están, el sistema no se
 * rompe: no manda nada y lo dice en el log. Eso permite trabajar en local
 * sin cuenta de correo, y permite que la tienda funcione desde el primer
 * día aunque el correo se configure la semana que viene.
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

type Mensaje = {
  para: string;
  asunto: string;
  html: string;
  texto: string;
};

function configuracion() {
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

/** A dónde llegan los avisos de venta. Sin esto no se avisa a nadie. */
export function correoDeAdmin(): string | null {
  return process.env.MAIL_ADMIN ?? process.env.SMTP_USER ?? null;
}

export function correoConfigurado(): boolean {
  return configuracion() !== null;
}

/**
 * Manda un correo. Devuelve si salió.
 *
 * No lanza nunca. Ver la nota de arriba.
 */
export async function enviarCorreo(m: Mensaje): Promise<boolean> {
  const cfg = configuracion();
  if (!cfg) {
    console.warn(
      `[correo] Sin configurar (falta SMTP_HOST/USER/PASS). No se envió «${m.asunto}» a ${m.para}.`
    );
    return false;
  }

  try {
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
    });
    return true;
  } catch (e) {
    console.error(`[correo] No salió «${m.asunto}» a ${m.para}:`, e);
    return false;
  }
}

/**
 * Envuelve el contenido en algo que se vea decente en cualquier cliente.
 *
 * Estilos en línea y tabla de una columna a propósito: Gmail borra las
 * hojas de estilo y Outlook todavía maqueta con tablas. Lo que acá parece
 * anticuado es lo único que se ve igual en los dos.
 */
export function plantilla(titulo: string, cuerpo: string): string {
  return `<!doctype html>
<html lang="es"><body style="margin:0;padding:24px;background:#faf9f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c1917">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto">
    <tr><td style="padding-bottom:20px">
      <div style="font-size:15px;letter-spacing:.08em;font-weight:600">LILUS</div>
      <div style="font-size:12px;color:#78716c">Jabones artesanales</div>
    </td></tr>
    <tr><td style="background:#fff;border:1px solid #e7e5e4;border-radius:12px;padding:24px">
      <h1 style="margin:0 0 16px;font-size:19px;font-weight:600">${titulo}</h1>
      ${cuerpo}
    </td></tr>
    <tr><td style="padding-top:16px;font-size:11px;color:#a8a29e;line-height:1.6">
      Este correo se envió automáticamente porque se registró un pedido en
      la tienda de LILUS.
    </td></tr>
  </table>
</body></html>`;
}
