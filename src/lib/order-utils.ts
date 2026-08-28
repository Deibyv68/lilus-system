import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { addMonths } from "date-fns";
import { DEFAULT_SHELF_LIFE_MONTHS } from "./constants";

/** Cliente de Prisma normal, o el de dentro de una transacción. */
type ClientePrisma = Prisma.TransactionClient | typeof prisma;

/**
 * El siguiente número de pedido.
 *
 * Se calcula desde el número más alto que existe, no desde cuántos hay.
 * Contar parece equivalente y no lo es: el panel permite borrar pedidos,
 * y al borrar uno el conteo baja. El siguiente pedido reclamaría un número
 * ya usado — o choca contra la restricción única y falla, o si el viejo se
 * borró, se reparte un número que ya salió impreso en una etiqueta y en un
 * mensaje al cliente.
 *
 * Los números van rellenos con ceros a seis cifras, así que ordenarlos como
 * texto da el mismo resultado que ordenarlos como números.
 */
export async function generateOrderNumber(
  cliente: ClientePrisma = prisma
): Promise<string> {
  const setting = await cliente.setting.findUnique({
    where: { key: "order_prefix" },
  });
  const prefix = setting?.value ?? "LILUS";

  const ultimo = await cliente.order.findFirst({
    where: { orderNumber: { startsWith: `${prefix}-` } },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });

  const anterior = ultimo
    ? Number.parseInt(ultimo.orderNumber.slice(prefix.length + 1), 10)
    : 0;
  const siguiente = (Number.isFinite(anterior) ? anterior : 0) + 1;

  return `${prefix}-${String(siguiente).padStart(6, "0")}`;
}

/**
 * Crea el pedido resolviendo su número, y reintenta si alguien se le
 * adelantó.
 *
 * Leer el último número y escribir el siguiente son dos pasos. Entre uno y
 * otro puede colarse otro pedido — algo que antes casi no pasaba porque
 * solo escribía el panel, y que pasa a ser normal ahora que la tienda
 * también crea pedidos, a cualquier hora y sin que nadie mire.
 *
 * La transacción cubre el caso normal. El reintento cubre el que la
 * transacción no puede: si aun así dos coinciden, la restricción única
 * hace fallar a uno (P2002) y ese vuelve a intentarlo con el número
 * siguiente en vez de romperle la compra a quien estaba pagando.
 */
export async function createOrderWithNumber(
  datos: Omit<Prisma.OrderUncheckedCreateInput, "orderNumber">,
  intentos = 5
) {
  for (let intento = 1; ; intento++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const orderNumber = await generateOrderNumber(tx);
        return tx.order.create({
          data: {
            /*
              Todo pedido nace con su enlace, venga de la tienda o del
              panel.

              Antes los cargados a mano nacían sin él, con el argumento de
              que «esos no se comparten con nadie». Resultó falso: una
              venta por WhatsApp también quiere mandarle a la clienta
              dónde ver cómo va y dónde subir su comprobante — y sin token
              esa página no existe, así que había que pedirle el número y
              el correo para entrar por «Mi pedido».

              Tenerlo no abre nada: son 24 bytes al azar, y quien no los
              tiene no llega. Lo que ahorra es un botón de «generar
              enlace» que habría que acordarse de pulsar.

              `datos` va después para que quien ya trae uno —la tienda lo
              genera por su cuenta— conserve el suyo.
            */
            publicToken: randomBytes(24).toString("base64url"),
            ...datos,
            orderNumber,
          },
        });
      });
    } catch (e) {
      const chocoElNumero =
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002" &&
        String(e.meta?.target ?? "").includes("orderNumber");

      if (!chocoElNumero || intento >= intentos) throw e;
      // Sin espera: el siguiente intento lee el número que acaba de
      // escribir el otro, que es justo lo que hace falta.
    }
  }
}

/** Lo que hace falta saber de un producto para etiquetar una unidad. */
export type ProductoParaEtiqueta = {
  id: string;
  sku: string;
  name: string;
  shortName: string | null;
  ingredients: string | null;
  shelfLifeMonths: number | null;
};

/**
 * Una fila por cada jabón que va a entrar en la caja.
 *
 * Un pack de cinco jabones son cinco unidades físicas, cada una con su
 * lote y su fecha de caducidad, porque cada una lleva su etiqueta pegada.
 * Quien llama ya expandió los packs; acá solo se numera y se fecha.
 *
 * Vive en un solo lugar a propósito: el formato del lote y el cálculo de
 * la caducidad salen impresos y quedan pegados al producto. Dos copias de
 * esto en dos archivos distintos terminan, tarde o temprano, imprimiendo
 * dos formatos distintos.
 */
export function buildProductionUnits(
  lineas: { producto: ProductoParaEtiqueta; cantidad: number }[],
  fecha: Date = new Date()
) {
  const unidades: Array<{
    productId: string;
    productName: string;
    productSku: string;
    batchCode: string;
    manufactureDate: Date;
    expiryDate: Date;
    ingredients: string | null;
  }> = [];

  let secuencia = 0;
  for (const { producto, cantidad } of lineas) {
    for (let i = 0; i < cantidad; i++) {
      secuencia++;
      unidades.push({
        productId: producto.id,
        // El nombre corto es el que cabe en una etiqueta de 2×1.
        productName: producto.shortName ?? producto.name,
        productSku: producto.sku,
        batchCode: generateBatchCode(fecha, secuencia),
        manufactureDate: fecha,
        expiryDate: calcExpiry(
          fecha,
          producto.shelfLifeMonths ?? DEFAULT_SHELF_LIFE_MONTHS
        ),
        ingredients: producto.ingredients,
      });
    }
  }

  return unidades;
}

export function generateBatchCode(date: Date = new Date(), sequence: number): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `L${y}${m}${d}-${String(sequence).padStart(3, "0")}`;
}

export function calcExpiry(manufactureDate: Date, shelfLifeMonths: number): Date {
  return addMonths(manufactureDate, shelfLifeMonths);
}
