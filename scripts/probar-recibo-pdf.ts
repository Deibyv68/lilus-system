import { writeFileSync } from "node:fs";
import { buildComprobantePdf } from "../src/lib/pdf-comprobante";

/**
 * Dibuja un comprobante de compra de mentira, para poder mirarlo.
 *
 *   npx tsx scripts/probar-recibo-pdf.ts salida
 *
 * Ojo con el nombre, porque hay dos: `probar-comprobante.ts` prueba la
 * lectura OCR de los comprobantes de PAGO que suben las clientas. Este
 * dibuja el comprobante de COMPRA que se lleva la clienta. La palabra es
 * la misma en los dos y los documentos no tienen nada que ver.
 *
 * Los datos de aquí no son los que mejor quedan, sino los que más rompen
 * la maqueta: un nombre largo, una calle que no cabe en una línea y un
 * pago a medias. Si con esto sale bien, con un pedido normal también.
 */

const salida = process.argv[2] ?? "comprobante";

async function main() {
  const bytes = await buildComprobantePdf({
    orderNumber: "LILUS-000015",
    fecha: new Date("2026-09-01T15:20:00Z"),
    estado: "pendiente",
    vendedor: {
      nombre: "Lupita Cárdenas",
      cedula: "1712345678",
      ciudad: "Quito, Pichincha",
      email: "contacto@liluscare.com",
      whatsapp: "593987654321",
    },
    comprador: {
      nombre: "María Fernanda Villalba Andrade",
      cedula: "1798765432",
      telefono: "0998877665",
      email: "mariafernanda.villalba@gmail.com",
    },
    entrega: {
      direccion:
        "Av. Amazonas N39-123 y Gaspar de Villarroel, edificio Torre Sol, dpto 704",
      ciudad: "Quito",
      provincia: "Pichincha",
      referencia: "Frente al parque, portón verde",
      transportadora: "Servientrega",
      guia: "SE-4429301188",
    },
    items: [
      { nombre: "Jabón de Avena y Miel", cantidad: 3, precioUnitario: 4.5, total: 13.5 },
      {
        nombre: "Pack Ritual de Luminosidad (4 jabones + esponja natural)",
        cantidad: 1,
        precioUnitario: 18,
        total: 18,
      },
      { nombre: "Jabón de Carbón Activado", cantidad: 2, precioUnitario: 5, total: 10 },
    ],
    subtotal: 41.5,
    envio: 5,
    total: 46.5,
    pagado: 20,
    falta: 26.5,
  });

  writeFileSync(`${salida}.pdf`, bytes);
  console.log(
    `${salida}.pdf`,
    bytes.length,
    "bytes,",
    Buffer.from(bytes.slice(0, 5)).toString()
  );
}

main();
