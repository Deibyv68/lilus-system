import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { formatCurrency, formatDate } from "./format";

/**
 * El comprobante de compra, como archivo PDF.
 *
 * ── Por qué existe, si ya hay una página imprimible ──
 *
 * Porque no son lo mismo. La página sirve para mirar y para imprimir; esto
 * sirve para **guardar y reenviar**. Quien pide su comprobante casi nunca
 * quiere una impresora: quiere un archivo que pueda adjuntar, mandar por
 * WhatsApp o meter en una carpeta.
 *
 * La página se queda igual —se actualiza sola y se lee en el teléfono— y
 * este archivo es una foto de cómo estaba el pedido en el momento de
 * descargarlo. Por eso lleva la fecha de emisión dentro: para que dentro
 * de un año se sepa a qué momento corresponde.
 *
 * ── Por qué maquetado a mano y no una página convertida ──
 *
 * Convertir HTML a PDF necesita un navegador entero corriendo en el
 * servidor. En una laptop que además atiende la tienda, eso es cientos de
 * megas de memoria para escribir una hoja de texto. `pdf-lib` dibuja las
 * líneas y ya — es lo mismo que hacen las etiquetas de envío, así que
 * tampoco es una técnica nueva en esta casa.
 */

const A4 = { ancho: 595.28, alto: 841.89 };
const MARGEN = 48;
const ANCHO_UTIL = A4.ancho - MARGEN * 2;

const NEGRO = rgb(0.11, 0.1, 0.09);
const GRIS = rgb(0.47, 0.44, 0.42);
const LINEA = rgb(0.906, 0.898, 0.894);
const VERDE = rgb(0.25, 0.38, 0.07);
const AMBAR = rgb(0.71, 0.33, 0.04);
const ROJO = rgb(0.6, 0.11, 0.11);

export type ComprobanteData = {
  orderNumber: string;
  fecha: Date;
  estado: "pagado" | "pendiente" | "anulado";
  vendedor: {
    nombre: string;
    cedula: string | null;
    ciudad: string | null;
    email: string | null;
    whatsapp: string | null;
  };
  comprador: {
    nombre: string;
    cedula: string | null;
    telefono: string | null;
    email: string | null;
  };
  entrega: {
    direccion: string;
    ciudad: string;
    provincia: string;
    referencia: string | null;
    transportadora: string | null;
    guia: string | null;
  } | null;
  items: { nombre: string; cantidad: number; precioUnitario: number; total: number }[];
  subtotal: number;
  envio: number;
  total: number;
  pagado: number;
  falta: number;
};

/**
 * Quita lo que la fuente no sabe dibujar.
 *
 * Las fuentes estándar de PDF usan una tabla de caracteres corta. Si le
 * llega algo que no está en ella —una comilla tipográfica pegada desde
 * Word, un emoji en el nombre de un producto— `pdf-lib` no lo dibuja mal:
 * lanza, y el comprobante entero se cae. Como el texto viene de campos
 * que teclea cualquiera, esto no es una precaución teórica.
 */
function limpiar(t: string): string {
  return t
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/ /g, " ")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "");
}

/** Parte un texto en las líneas que caben en un ancho dado. */
function envolver(
  texto: string,
  fuente: PDFFont,
  tam: number,
  ancho: number
): string[] {
  const palabras = limpiar(texto).split(/\s+/).filter(Boolean);
  const lineas: string[] = [];
  let actual = "";

  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p;
    if (fuente.widthOfTextAtSize(prueba, tam) <= ancho) {
      actual = prueba;
    } else {
      if (actual) lineas.push(actual);
      actual = p;
    }
  }
  if (actual) lineas.push(actual);
  return lineas.length ? lineas : [""];
}

export async function buildComprobantePdf(
  d: ComprobanteData
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Comprobante ${d.orderNumber} - LILUS`);
  pdf.setAuthor("LILUS");
  pdf.setSubject("Comprobante de compra");

  let page = pdf.addPage([A4.ancho, A4.alto]);
  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const negrita = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = A4.alto - MARGEN;

  const texto = (
    t: string,
    x: number,
    tam: number,
    fuente = normal,
    color = NEGRO
  ) => page.drawText(limpiar(t), { x, y, size: tam, font: fuente, color });

  const derecha = (
    t: string,
    xFin: number,
    tam: number,
    fuente = normal,
    color = NEGRO
  ) => {
    const l = limpiar(t);
    page.drawText(l, {
      x: xFin - fuente.widthOfTextAtSize(l, tam),
      y,
      size: tam,
      font: fuente,
      color,
    });
  };

  const raya = (separacion = 14) => {
    y -= separacion;
    page.drawLine({
      start: { x: MARGEN, y },
      end: { x: MARGEN + ANCHO_UTIL, y },
      thickness: 0.7,
      color: LINEA,
    });
    y -= separacion;
  };

  const derechaX = MARGEN + ANCHO_UTIL;
  const xCant = MARGEN + ANCHO_UTIL * 0.58;
  const xPrecio = MARGEN + ANCHO_UTIL * 0.76;
  const xTotal = derechaX;

  /*
    El suelo de la hoja.

    No es el margen: es el margen más el alto de la nota legal, porque esa
    nota va anclada abajo y lo que se escriba por debajo de esta línea le
    caería encima. Un comprobante con la advertencia tachada por una fila
    de productos es exactamente el documento que no queremos emitir.
  */
  const SUELO = MARGEN + 92;

  /* Encabezado de la tabla, que se repite en cada hoja nueva. */
  const encabezadoDeTabla = () => {
    texto("PRODUCTO", MARGEN, 7.5, negrita, GRIS);
    derecha("CANT.", xCant, 7.5, negrita, GRIS);
    derecha("PRECIO", xPrecio, 7.5, negrita, GRIS);
    derecha("TOTAL", xTotal, 7.5, negrita, GRIS);
    y -= 8;
    page.drawLine({
      start: { x: MARGEN, y },
      end: { x: derechaX, y },
      thickness: 0.7,
      color: LINEA,
    });
    y -= 16;
  };

  /**
   * Abre hoja nueva si lo que viene no cabe.
   *
   * Los pedidos de hoy son de tres o cuatro líneas y entran de sobra en
   * una cara. Pero «hoy no pasa» no es lo mismo que «no puede pasar»: el
   * día que alguien pida quince jabones sueltos, sin esto el comprobante
   * saldría con la mitad de la compra fuera del papel y nadie se enteraría
   * hasta que la clienta reclamara.
   */
  const asegurar = (alto: number, conEncabezado = false) => {
    if (y - alto >= SUELO) return;
    page = pdf.addPage([A4.ancho, A4.alto]);
    y = A4.alto - MARGEN;
    /* Que se sepa de qué pedido es esta hoja suelta. */
    derecha(`${d.orderNumber} (continuación)`, derechaX, 8, normal, GRIS);
    y -= 24;
    if (conEncabezado) encabezadoDeTabla();
  };

  // ── Cabecera ──
  const yCabecera = y;
  texto("LILUS", MARGEN, 22, negrita);
  derecha("COMPROBANTE DE COMPRA", derechaX, 8, negrita, GRIS);

  y -= 15;
  texto("Jabones artesanales", MARGEN, 8.5, normal, GRIS);
  derecha(d.orderNumber, derechaX, 16, negrita);

  y -= 18;
  derecha(formatDate(d.fecha), derechaX, 9, normal, GRIS);

  // El sello de estado, en recuadro y sin relleno: la tinta se agradece.
  const etiqueta =
    d.estado === "pagado"
      ? "PAGADO"
      : d.estado === "anulado"
        ? "ANULADO"
        : "PENDIENTE DE PAGO";
  const colorSello =
    d.estado === "pagado" ? VERDE : d.estado === "anulado" ? ROJO : AMBAR;
  const anchoSello = negrita.widthOfTextAtSize(etiqueta, 8) + 16;
  y -= 20;
  page.drawRectangle({
    x: derechaX - anchoSello,
    y: y - 4,
    width: anchoSello,
    height: 18,
    borderColor: colorSello,
    borderWidth: 0.8,
  });
  page.drawText(etiqueta, {
    x: derechaX - anchoSello + 8,
    y: y + 1,
    size: 8,
    font: negrita,
    color: colorSello,
  });

  // Los datos del vendedor van bajo la marca, en la columna izquierda.
  let yVendedor = yCabecera - 34;
  const lineaVendedor = (t: string) => {
    page.drawText(limpiar(t), {
      x: MARGEN,
      y: yVendedor,
      size: 8.5,
      font: normal,
      color: GRIS,
    });
    yVendedor -= 11;
  };
  lineaVendedor(d.vendedor.nombre);
  if (d.vendedor.cedula) lineaVendedor(`Cédula ${d.vendedor.cedula}`);
  if (d.vendedor.ciudad) lineaVendedor(d.vendedor.ciudad);
  if (d.vendedor.email) lineaVendedor(d.vendedor.email);
  if (d.vendedor.whatsapp) lineaVendedor(`WhatsApp ${d.vendedor.whatsapp}`);

  y = Math.min(y - 6, yVendedor);
  raya();

  // ── Comprador y entrega, a dos columnas ──
  const yBloques = y;
  const anchoCol = ANCHO_UTIL / 2 - 12;
  const xCol2 = MARGEN + ANCHO_UTIL / 2 + 12;

  const columna = (
    x: number,
    titulo: string,
    lineas: (string | null)[],
    desde: number
  ): number => {
    let yy = desde;
    page.drawText(limpiar(titulo), {
      x, y: yy, size: 7.5, font: negrita, color: GRIS,
    });
    yy -= 15;
    for (const l of lineas) {
      if (!l) continue;
      for (const trozo of envolver(l, normal, 9.5, anchoCol)) {
        page.drawText(trozo, { x, y: yy, size: 9.5, font: normal, color: NEGRO });
        yy -= 12.5;
      }
    }
    return yy;
  };

  const finCol1 = columna(
    MARGEN,
    "COMPRADOR",
    [
      d.comprador.nombre,
      d.comprador.cedula ? `Cédula ${d.comprador.cedula}` : null,
      d.comprador.telefono,
      d.comprador.email,
    ],
    yBloques
  );

  const finCol2 = d.entrega
    ? columna(
        xCol2,
        "ENTREGA",
        [
          d.entrega.direccion,
          `${d.entrega.ciudad}, ${d.entrega.provincia}`,
          d.entrega.referencia,
          d.entrega.transportadora
            ? `${d.entrega.transportadora}${d.entrega.guia ? ` - guía ${d.entrega.guia}` : ""}`
            : null,
        ],
        yBloques
      )
    : yBloques;

  y = Math.min(finCol1, finCol2) + 4;
  raya();

  // ── La tabla ──
  encabezadoDeTabla();

  for (const i of d.items) {
    const trozos = envolver(i.nombre, normal, 9.5, ANCHO_UTIL * 0.54);
    asegurar(trozos.length * 12 + 24, true);
    const yFila = y;
    trozos.forEach((t, n) => {
      page.drawText(t, {
        x: MARGEN, y: yFila - n * 12, size: 9.5, font: normal, color: NEGRO,
      });
    });
    y = yFila;
    derecha(String(i.cantidad), xCant, 9.5);
    derecha(formatCurrency(i.precioUnitario), xPrecio, 9.5, normal, GRIS);
    derecha(formatCurrency(i.total), xTotal, 9.5);

    y = yFila - (trozos.length - 1) * 12 - 9;
    page.drawLine({
      start: { x: MARGEN, y },
      end: { x: derechaX, y },
      thickness: 0.5,
      color: LINEA,
    });
    y -= 15;
  }

  // ── Totales, en columna estrecha a la derecha ──
  const xEtiqueta = MARGEN + ANCHO_UTIL * 0.6;
  const fila = (etq: string, valor: string, fuente = normal, color = NEGRO) => {
    page.drawText(limpiar(etq), {
      x: xEtiqueta, y, size: 9.5, font: fuente, color: fuente === negrita ? NEGRO : GRIS,
    });
    derecha(valor, xTotal, fuente === negrita ? 12 : 9.5, fuente, color);
    y -= 15;
  };

  /* El bloque de totales entero o en la hoja siguiente: partirlo por la
     mitad deja un «Total» huérfano y es la cifra que todo el mundo busca. */
  asegurar(d.pagado > 0 ? 92 : 56);
  y -= 4;
  fila("Productos", formatCurrency(d.subtotal));
  fila("Envío", formatCurrency(d.envio));

  y -= 2;
  page.drawLine({
    start: { x: xEtiqueta, y: y + 10 },
    end: { x: xTotal, y: y + 10 },
    thickness: 0.7,
    color: LINEA,
  });
  fila("Total", formatCurrency(d.total), negrita);

  if (d.pagado > 0) {
    fila("Pagado", formatCurrency(d.pagado));
    if (d.falta > 0) fila("Falta", formatCurrency(d.falta), negrita, AMBAR);
  }

  // ── La advertencia, anclada al pie de la última hoja ──
  y = MARGEN + 54;
  page.drawLine({
    start: { x: MARGEN, y: y + 16 },
    end: { x: derechaX, y: y + 16 },
    thickness: 0.7,
    color: LINEA,
  });

  const aviso =
    "Este documento es un comprobante de compra y sirve como constancia de la transacción. " +
    "No constituye una factura ni una nota de venta, y no tiene validez tributaria para deducir gastos.";
  for (const l of envolver(aviso, normal, 8, ANCHO_UTIL)) {
    page.drawText(l, { x: MARGEN, y, size: 8, font: normal, color: GRIS });
    y -= 11;
  }
  y -= 4;
  page.drawText(
    limpiar(
      `Emitido por LILUS - ${formatDate(new Date())} - Pedido ${d.orderNumber}`
    ),
    { x: MARGEN, y, size: 8, font: normal, color: GRIS }
  );

  return pdf.save();
}
