import "server-only";
import { prisma } from "./prisma";
import { formatCurrency } from "./format";
import { enviarCorreo, plantilla, correoDeAdmin } from "./correo";

/**
 * Los dos correos que salen cuando entra un pedido por la web.
 *
 * Uno para quien compró, con su número de pedido y cómo pagar. Otro para
 * la dueña, que si no se entera solo mirando el panel — y un pedido que
 * entra un domingo a las once de la noche se quedaría esperando a que
 * alguien se acuerde de abrirlo.
 *
 * Los dos son «mejor esfuerzo»: si el correo no sale, el pedido ya está
 * guardado igual. Lo único que se pierde es el aviso, y para eso está el
 * log. Ver la nota de `correo.ts`.
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
 * correo se abre en Gmail, no dentro del sitio. Todavía no hay dominio
 * comprado, así que se configura por variable de entorno y se puede
 * cambiar el día que lo haya sin tocar código.
 */
function baseUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

async function ajustes() {
  const filas = await prisma.setting.findMany({
    where: { key: { in: ["bank_details", "contact_whatsapp"] } },
  });
  const mapa = Object.fromEntries(filas.map((f) => [f.key, f.value]));
  return {
    banco: mapa.bank_details?.trim() || null,
    whatsapp: mapa.contact_whatsapp?.replace(/\D/g, "") || null,
  };
}

function filasDeItems(items: PedidoParaAviso["items"]): string {
  return items
    .map(
      (i) =>
        `<tr>
          <td style="padding:6px 0;font-size:14px">${escapar(String(i.quantity))}× ${escapar(i.itemName)}</td>
          <td style="padding:6px 0;font-size:14px;text-align:right;white-space:nowrap">${formatCurrency(i.lineTotal)}</td>
        </tr>`
    )
    .join("");
}

/**
 * Escapa lo que escribió el cliente antes de meterlo en el HTML del correo.
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

/** Confirmación para quien compró. */
export async function avisarAlCliente(p: PedidoParaAviso): Promise<boolean> {
  if (!p.clienteEmail) return false;

  const { banco, whatsapp } = await ajustes();
  const enlace = `${baseUrl()}/pedido/${p.publicToken}`;
  const primerNombre = escapar(p.clienteNombre.split(" ")[0]);

  const comoPagar = banco
    ? `<p style="margin:0 0 8px;font-size:14px">Para completarlo, transfiere
         <strong>${formatCurrency(p.total)}</strong> a:</p>
       <p style="margin:0 0 12px;padding:12px;background:#faf9f7;border-radius:8px;font-size:14px;white-space:pre-line">${escapar(banco)}</p>`
    : `<p style="margin:0 0 12px;font-size:14px">Te escribimos con los datos de la
         cuenta para transferir <strong>${formatCurrency(p.total)}</strong>.</p>`;

  const avisoComprobante = whatsapp
    ? `<p style="margin:0 0 16px;font-size:14px">Cuando la hagas, mándanos el
         comprobante por <a href="https://wa.me/${whatsapp}" style="color:#1c1917">WhatsApp</a>
         indicando el número <strong>${p.orderNumber}</strong>.</p>`
    : `<p style="margin:0 0 16px;font-size:14px">Cuando la hagas, mándanos el
         comprobante indicando el número <strong>${p.orderNumber}</strong>.</p>`;

  const html = plantilla(
    `${primerNombre}, recibimos tu pedido`,
    `<p style="margin:0 0 16px;font-size:14px;line-height:1.6">
       Tu pedido <strong>${p.orderNumber}</strong> quedó registrado.
     </p>
     ${comoPagar}
     ${avisoComprobante}
     <table role="presentation" width="100%" style="border-top:1px solid #e7e5e4;margin-top:8px;padding-top:8px">
       ${filasDeItems(p.items)}
       <tr><td style="padding:6px 0;font-size:14px;color:#78716c">Envío</td>
           <td style="padding:6px 0;font-size:14px;text-align:right">${formatCurrency(p.shippingCost)}</td></tr>
       <tr><td style="padding:10px 0 0;font-weight:600;border-top:1px solid #e7e5e4">Total</td>
           <td style="padding:10px 0 0;font-weight:600;text-align:right;border-top:1px solid #e7e5e4">${formatCurrency(p.total)}</td></tr>
     </table>
     <p style="margin:22px 0 0">
       <a href="${enlace}" style="display:inline-block;background:#1c1917;color:#fafaf9;text-decoration:none;padding:11px 20px;border-radius:999px;font-size:14px">Ver mi pedido</a>
     </p>
     <p style="margin:14px 0 0;font-size:12px;color:#78716c">
       Guarda ese enlace: es donde puedes ver cómo va tu pedido en cualquier momento.
     </p>`
  );

  const texto = [
    `${primerNombre}, recibimos tu pedido ${p.orderNumber}.`,
    "",
    `Total a transferir: ${formatCurrency(p.total)}`,
    banco ? `\nDatos de la cuenta:\n${banco}` : "",
    whatsapp ? `\nComprobante por WhatsApp: https://wa.me/${whatsapp}` : "",
    "",
    `Sigue tu pedido acá: ${enlace}`,
  ].join("\n");

  return enviarCorreo({
    para: p.clienteEmail,
    asunto: `Tu pedido ${p.orderNumber} · LILUS`,
    html,
    texto,
  });
}

/** Aviso para la dueña: entró una venta. */
export async function avisarAlAdmin(p: PedidoParaAviso): Promise<boolean> {
  const destino = correoDeAdmin();
  if (!destino) return false;

  const enlacePanel = `${baseUrl()}/sistema/pedidos`;

  const html = plantilla(
    `Pedido nuevo por la web · ${formatCurrency(p.total)}`,
    `<table role="presentation" width="100%" style="font-size:14px">
       <tr><td style="padding:4px 0;color:#78716c">Pedido</td><td style="padding:4px 0;text-align:right"><strong>${p.orderNumber}</strong></td></tr>
       <tr><td style="padding:4px 0;color:#78716c">Cliente</td><td style="padding:4px 0;text-align:right">${escapar(p.clienteNombre)}</td></tr>
       <tr><td style="padding:4px 0;color:#78716c">Teléfono</td><td style="padding:4px 0;text-align:right">${escapar(p.clienteTelefono ?? "—")}</td></tr>
       <tr><td style="padding:4px 0;color:#78716c">Envío a</td><td style="padding:4px 0;text-align:right">${escapar(p.ciudad)}, ${escapar(p.provincia)}</td></tr>
     </table>
     <table role="presentation" width="100%" style="border-top:1px solid #e7e5e4;margin-top:14px;padding-top:6px">
       ${filasDeItems(p.items)}
       <tr><td style="padding:10px 0 0;font-weight:600;border-top:1px solid #e7e5e4">Total</td>
           <td style="padding:10px 0 0;font-weight:600;text-align:right;border-top:1px solid #e7e5e4">${formatCurrency(p.total)}</td></tr>
     </table>
     <p style="margin:20px 0 0;padding:12px;background:#faf9f7;border-radius:8px;font-size:13px;line-height:1.6">
       Está en <strong>pendiente</strong> hasta que confirmes que llegó la
       transferencia. Cuando la veas, cambia el estado a «Pagado» desde el panel.
     </p>
     <p style="margin:18px 0 0">
       <a href="${enlacePanel}" style="display:inline-block;background:#1c1917;color:#fafaf9;text-decoration:none;padding:11px 20px;border-radius:999px;font-size:14px">Abrir el panel</a>
     </p>`
  );

  const texto = [
    `PEDIDO NUEVO POR LA WEB — ${p.orderNumber} — ${formatCurrency(p.total)}`,
    "",
    `Cliente:  ${p.clienteNombre}`,
    `Teléfono: ${p.clienteTelefono ?? "—"}`,
    `Envío a:  ${p.ciudad}, ${p.provincia}`,
    "",
    ...p.items.map((i) => `  ${i.quantity}x ${i.itemName}  ${formatCurrency(i.lineTotal)}`),
    "",
    `Total: ${formatCurrency(p.total)}`,
    "",
    "Queda en pendiente hasta que confirmes la transferencia.",
    enlacePanel,
  ].join("\n");

  return enviarCorreo({
    para: destino,
    asunto: `Pedido nuevo ${p.orderNumber} · ${formatCurrency(p.total)}`,
    html,
    texto,
  });
}
