import "server-only";
import { prisma } from "./prisma";
import { formatCurrency } from "./format";
import { enviarCorreo, plantilla, boton, correoDeAdmin } from "./correo";

/**
 * Los correos automáticos de un pedido.
 *
 * ── Los tres momentos ──
 *
 * Son los tres en que quien compró se pregunta qué está pasando:
 *
 *   1. Acabo de pagar por internet a un negocio que no conozco.  → «lo recibimos»
 *   2. Transferí hace rato y no sé si lo vieron.                 → «confirmamos tu pago»
 *   3. Ya me lo cobraron, ¿dónde está mi caja?                   → «salió, aquí va la guía»
 *
 * Antes solo salía el primero, y los otros dos los mandaba la dueña a mano
 * por WhatsApp cuando se acordaba. Salen solos porque son exactamente los
 * ratos en los que nadie quiere tener que preguntar.
 *
 * ── Todos son «mejor esfuerzo» ──
 *
 * Si el correo no sale, el pedido ya está guardado y su estado ya cambió.
 * Lo único que se pierde es el aviso, y eso queda en el historial del
 * pedido. Ningún fallo de correo puede tumbar una venta.
 */

export type PedidoParaAviso = {
  orderNumber: string;
  publicToken: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  clienteNombre: string;
  clienteEmail: string | null;
  clienteTelefono: string | null;
  ciudad: string;
  provincia: string;
  items: { itemName: string; quantity: number; lineTotal: number }[];
};

/**
 * La dirección desde la que se ve la tienda.
 *
 * Los correos llevan enlaces, y un enlace necesita el dominio completo: el
 * correo se abre en Gmail, no dentro del sitio.
 */
function baseUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

async function ajustes() {
  const filas = await prisma.setting.findMany({
    where: {
      key: { in: ["bank_details", "deuna_enlace", "contact_whatsapp"] },
    },
  });
  const mapa = Object.fromEntries(filas.map((f) => [f.key, f.value]));
  return {
    banco: mapa.bank_details?.trim() || null,
    deuna: mapa.deuna_enlace?.trim() || null,
    whatsapp: mapa.contact_whatsapp?.replace(/\D/g, "") || null,
  };
}

/**
 * Escapa lo que escribió el cliente antes de meterlo en el HTML.
 *
 * El nombre y la dirección los teclea cualquiera en un formulario abierto.
 * Sin esto, alguien podría poner etiquetas HTML en su nombre y quedarían
 * incrustadas en el correo que lee la dueña.
 */
function escapar(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * El resumen del pedido: qué se compró y cuánto costó.
 *
 * Va DENTRO del correo, no solo como enlace. Quien lo recibe tiene que
 * poder comprobar de un vistazo que lo que pidió es lo que quería, sin
 * abrir nada — sobre todo en el primero, que llega cuando todavía no ha
 * pagado y aún está a tiempo de decir «esto no es lo que quería».
 */
function bloqueDeResumen(p: PedidoParaAviso): string {
  const filas = p.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:7px 0;font-size:14px;color:#1c1917">
            <span style="color:#a8a29e">${escapar(String(i.quantity))}×</span>
            ${escapar(i.itemName)}
          </td>
          <td style="padding:7px 0;font-size:14px;color:#1c1917;text-align:right;white-space:nowrap">${formatCurrency(i.lineTotal)}</td>
        </tr>`
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0;border-top:1px solid #e7e5e4;padding-top:6px">
    ${filas}
    <tr>
      <td style="padding:7px 0;font-size:14px;color:#78716c;border-top:1px solid #f5f5f4">Envío a ${escapar(p.ciudad)}</td>
      <td style="padding:7px 0;font-size:14px;color:#78716c;text-align:right;border-top:1px solid #f5f5f4">${formatCurrency(p.shippingCost)}</td>
    </tr>
    <tr>
      <td style="padding:11px 0 0;font-size:15px;font-weight:600;color:#1c1917;border-top:1px solid #e7e5e4">Total</td>
      <td style="padding:11px 0 0;font-size:15px;font-weight:600;color:#1c1917;text-align:right;border-top:1px solid #e7e5e4">${formatCurrency(p.total)}</td>
    </tr>
  </table>`;
}

/** El pie con a quién escribir. Igual en los tres. */
function pieDeContacto(whatsapp: string | null): string {
  const wa = whatsapp
    ? ` · <a href="https://wa.me/${whatsapp}" style="color:#78716c">WhatsApp</a>`
    : "";
  return `<p style="margin:0">¿Alguna duda? Responde a este correo${wa}.</p>`;
}

/** El enlace al comprobante, que va debajo del resumen en los tres. */
function enlaceAlComprobante(token: string): string {
  return `<p style="margin:16px 0 0;font-size:13px;color:#a8a29e">
    <a href="${baseUrl()}/pedido/${token}/recibo" style="color:#78716c">Ver el comprobante de compra</a>
  </p>`;
}

/** Solo el nombre de pila, que es como se habla. */
function primerNombre(nombre: string): string {
  return escapar(nombre.trim().split(/\s+/)[0] ?? nombre);
}

// ══════════════════════════════════════════════════════════
// 1. Entró el pedido
// ══════════════════════════════════════════════════════════

export async function avisarAlCliente(p: PedidoParaAviso): Promise<boolean> {
  if (!p.clienteEmail) return false;

  const { banco, deuna, whatsapp } = await ajustes();
  const enlace = `${baseUrl()}/pedido/${p.publicToken}`;
  const nombre = primerNombre(p.clienteNombre);

  /*
    El botón de DeUna va como enlace, no como QR.

    Un QR en un correo se manda como imagen incrustada, y Gmail —entre
    otros— bloquea las imágenes hasta que quien lee las autorice. Un
    código que no se ve no sirve para nada. El enlace se abre de un toque
    desde el teléfono, que es donde se lee el correo; el QR está en la
    página del pedido, para quien esté en el computador.
  */
  const botonDeuna = deuna
    ? `${boton(`Pagar ${formatCurrency(p.total)} con DeUna`, escapar(deuna))}
       <p style="margin:12px 0 0;font-size:13px;color:#78716c">Pon
         <strong style="color:#1c1917">${formatCurrency(p.total)}</strong> como monto y
         <strong style="color:#1c1917">${escapar(p.orderNumber)}</strong> como referencia.</p>`
    : "";

  const porTransferencia = banco
    ? `<p style="margin:${botonDeuna ? "18px" : "0"} 0 8px;font-size:14px;color:#1c1917">${botonDeuna ? "O transfiere" : "Transfiere"}
         <strong>${formatCurrency(p.total)}</strong> a:</p>
       <p style="margin:0;padding:14px;background:#faf9f7;border:1px solid #f0efed;border-radius:10px;font-size:14px;color:#1c1917;white-space:pre-line">${escapar(banco)}</p>`
    : "";

  const comoPagar =
    botonDeuna || porTransferencia
      ? botonDeuna + porTransferencia
      : `<p style="margin:0;font-size:14px;color:#1c1917">Te escribimos enseguida con los datos
           de la cuenta para transferir <strong>${formatCurrency(p.total)}</strong>.</p>`;

  const avisoComprobante = whatsapp
    ? `<p style="margin:18px 0 0;font-size:14px;color:#1c1917">Cuando la hagas, mándanos la captura por
         <a href="https://wa.me/${whatsapp}" style="color:#1c1917;font-weight:500">WhatsApp</a>
         poniendo <strong>${escapar(p.orderNumber)}</strong>, y la revisamos.</p>`
    : `<p style="margin:18px 0 0;font-size:14px;color:#1c1917">Cuando la hagas, mándanos la captura
         poniendo <strong>${escapar(p.orderNumber)}</strong>, y la revisamos.</p>`;

  const html = plantilla(
    `${nombre}, recibimos tu pedido`,
    `${comoPagar}
     ${avisoComprobante}
     ${bloqueDeResumen(p)}
     <p style="margin:26px 0 0">${boton("Ver mi pedido", enlace)}</p>
     <p style="margin:12px 0 0;font-size:13px;color:#a8a29e">
       Guarda ese enlace: es donde ves cómo va tu pedido en cualquier momento,
       sin contraseñas.
     </p>
     ${enlaceAlComprobante(p.publicToken)}`,
    {
      entradilla: `Tu pedido ${p.orderNumber} quedó registrado. Falta el pago para empezar a prepararlo.`,
      pie: pieDeContacto(whatsapp),
    }
  );

  const texto = [
    `${nombre}, recibimos tu pedido ${p.orderNumber}.`,
    "",
    `Total: ${formatCurrency(p.total)}`,
    banco ? `\nDatos de la cuenta:\n${banco}` : "",
    deuna ? `\nPagar con DeUna: ${deuna}` : "",
    whatsapp ? `\nMándanos la captura por WhatsApp: https://wa.me/${whatsapp}` : "",
    "",
    `Sigue tu pedido acá: ${enlace}`,
    `Comprobante: ${baseUrl()}/pedido/${p.publicToken}/recibo`,
  ].join("\n");

  return enviarCorreo({
    para: p.clienteEmail,
    asunto: `Tu pedido ${p.orderNumber} · LILUS`,
    html,
    texto,
  });
}

// ══════════════════════════════════════════════════════════
// 2. Se confirmó el pago
// ══════════════════════════════════════════════════════════

/**
 * ── Por qué este correo importa tanto ──
 *
 * Es el hueco más incómodo de toda la compra: la clienta ya mandó el
 * dinero y todavía no tiene nada que diga que llegó. Ese silencio es
 * exactamente cuando la gente escribe «¿oye, les llegó?» — o peor, cuando
 * se arrepiente de haber transferido a un desconocido.
 */
export async function avisarPagoConfirmado(p: PedidoParaAviso): Promise<boolean> {
  if (!p.clienteEmail) return false;

  const { whatsapp } = await ajustes();
  const enlace = `${baseUrl()}/pedido/${p.publicToken}`;
  const nombre = primerNombre(p.clienteNombre);

  const html = plantilla(
    `${nombre}, confirmamos tu pago`,
    `<p style="margin:0;font-size:14px;line-height:1.65;color:#1c1917">
       Ya vimos tu transferencia de <strong>${formatCurrency(p.total)}</strong>.
       Empezamos a preparar tu pedido y te avisamos en cuanto salga.
     </p>
     ${bloqueDeResumen(p)}
     <p style="margin:26px 0 0">${boton("Ver mi pedido", enlace)}</p>
     ${enlaceAlComprobante(p.publicToken)}`,
    {
      entradilla: `Recibimos el pago de tu pedido ${p.orderNumber}. Ya lo estamos preparando.`,
      pie: pieDeContacto(whatsapp),
    }
  );

  const texto = [
    `${nombre}, confirmamos el pago de tu pedido ${p.orderNumber}.`,
    "",
    `Recibimos ${formatCurrency(p.total)}. Ya lo estamos preparando.`,
    "",
    `Sigue tu pedido acá: ${enlace}`,
    `Comprobante: ${baseUrl()}/pedido/${p.publicToken}/recibo`,
  ].join("\n");

  return enviarCorreo({
    para: p.clienteEmail,
    asunto: `Confirmamos tu pago · ${p.orderNumber}`,
    html,
    texto,
  });
}

// ══════════════════════════════════════════════════════════
// 3. Salió el pedido
// ══════════════════════════════════════════════════════════

export async function avisarEnviado(
  p: PedidoParaAviso,
  envio: { transportadora: string | null; guia: string | null; enlaceGuia: string | null }
): Promise<boolean> {
  if (!p.clienteEmail) return false;

  const { whatsapp } = await ajustes();
  const enlace = `${baseUrl()}/pedido/${p.publicToken}`;
  const nombre = primerNombre(p.clienteNombre);

  /*
    La guía va en un bloque aparte y en grande.

    Es el único dato del correo que alguien va a copiar y pegar en otra
    web. Enterrarlo en una frase obliga a seleccionarlo con el dedo, que
    en un teléfono es justo lo que nadie consigue a la primera.
  */
  const bloqueGuia = envio.guia
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 0;background:#faf9f7;border:1px solid #f0efed;border-radius:10px">
         <tr><td style="padding:16px">
           <p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#a8a29e">
             Guía${envio.transportadora ? ` · ${escapar(envio.transportadora)}` : ""}
           </p>
           <p style="margin:0;font-size:19px;font-weight:600;letter-spacing:.02em;color:#1c1917">${escapar(envio.guia)}</p>
           ${
             envio.enlaceGuia
               ? `<p style="margin:10px 0 0;font-size:13px"><a href="${escapar(envio.enlaceGuia)}" style="color:#1c1917;font-weight:500">Rastrear el envío</a></p>`
               : ""
           }
         </td></tr>
       </table>`
    : "";

  const html = plantilla(
    `${nombre}, tu pedido va en camino`,
    `<p style="margin:0;font-size:14px;line-height:1.65;color:#1c1917">
       Tu pedido <strong>${escapar(p.orderNumber)}</strong> salió hacia
       ${escapar(p.ciudad)}${p.provincia ? `, ${escapar(p.provincia)}` : ""}.
     </p>
     ${bloqueGuia}
     ${bloqueDeResumen(p)}
     <p style="margin:26px 0 0">${boton("Ver mi pedido", enlace)}</p>
     ${enlaceAlComprobante(p.publicToken)}`,
    {
      entradilla: envio.guia
        ? `Tu pedido ${p.orderNumber} ya salió. Guía ${envio.guia}.`
        : `Tu pedido ${p.orderNumber} ya salió.`,
      pie: pieDeContacto(whatsapp),
    }
  );

  const texto = [
    `${nombre}, tu pedido ${p.orderNumber} va en camino.`,
    "",
    envio.guia
      ? `Guía${envio.transportadora ? ` (${envio.transportadora})` : ""}: ${envio.guia}`
      : "",
    envio.enlaceGuia ? `Rastrear: ${envio.enlaceGuia}` : "",
    "",
    `Sigue tu pedido acá: ${enlace}`,
  ]
    .filter(Boolean)
    .join("\n");

  return enviarCorreo({
    para: p.clienteEmail,
    asunto: `Tu pedido va en camino · ${p.orderNumber}`,
    html,
    texto,
  });
}

// ══════════════════════════════════════════════════════════
// Y el de la dueña
// ══════════════════════════════════════════════════════════

/** Aviso para la dueña: entró una venta. */
export async function avisarAlAdmin(p: PedidoParaAviso): Promise<boolean> {
  const destino = correoDeAdmin();
  if (!destino) return false;

  const enlacePanel = `${baseUrl()}/sistema/pedidos`;

  const html = plantilla(
    `Venta nueva · ${formatCurrency(p.total)}`,
    `<p style="margin:0;font-size:14px;line-height:1.65;color:#1c1917">
       <strong>${escapar(p.clienteNombre)}</strong> — ${escapar(p.ciudad)}, ${escapar(p.provincia)}
       ${p.clienteTelefono ? `<br>${escapar(p.clienteTelefono)}` : ""}
       ${p.clienteEmail ? `<br>${escapar(p.clienteEmail)}` : ""}
     </p>
     ${bloqueDeResumen(p)}
     <p style="margin:26px 0 0">${boton("Abrir en el panel", enlacePanel)}</p>`,
    {
      entradilla: `${p.orderNumber} · ${escapar(p.clienteNombre)} · ${formatCurrency(p.total)}`,
      pie: `<p style="margin:0">Pedido ${escapar(p.orderNumber)}, esperando pago.</p>`,
    }
  );

  const texto = [
    `Venta nueva: ${p.orderNumber} — ${formatCurrency(p.total)}`,
    `${p.clienteNombre} · ${p.ciudad}, ${p.provincia}`,
    p.clienteTelefono ?? "",
    p.clienteEmail ?? "",
    "",
    ...p.items.map((i) => `${i.quantity}× ${i.itemName} — ${formatCurrency(i.lineTotal)}`),
    "",
    `Total: ${formatCurrency(p.total)}`,
    `Panel: ${enlacePanel}`,
  ]
    .filter(Boolean)
    .join("\n");

  return enviarCorreo({
    para: destino,
    asunto: `Venta ${p.orderNumber} · ${formatCurrency(p.total)}`,
    html,
    texto,
  });
}
