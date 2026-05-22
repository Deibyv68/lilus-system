import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { addMonths } from "date-fns";

const prisma = new PrismaClient();

async function generateOrderNumber(): Promise<string> {
  const setting = await prisma.setting.findUnique({ where: { key: "order_prefix" } });
  const prefix = setting?.value ?? "LILUS";
  const count = await prisma.order.count();
  return `${prefix}-${String(count + 1).padStart(6, "0")}`;
}

async function main() {
  const product = await prisma.product.findFirst();
  const zone = await prisma.shippingZone.findFirst({ where: { name: "Quito" } });
  const carrier = await prisma.carrier.findFirst();
  if (!product || !zone || !carrier) {
    throw new Error("Falta producto / zona / transportadora en la BD");
  }

  const customer = await prisma.customer.create({
    data: { name: "Cliente Prueba", cedula: "1700000000", phone: "0999999999" },
  });
  const address = await prisma.shippingAddress.create({
    data: {
      customerId: customer.id,
      zoneId: zone.id,
      province: "Pichincha",
      city: "Quito",
      address: "Av. Test 123",
      isDefault: true,
    },
  });

  const now = new Date();
  const orderNumber = await generateOrderNumber();
  const subtotal = product.price * 2;
  const shippingCost = 3.5;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      status: "PENDING",
      customerId: customer.id,
      shippingAddressId: address.id,
      carrierId: carrier.id,
      zoneId: zone.id,
      shippingCost,
      subtotal,
      total: subtotal + shippingCost,
      source: "TEST",
      items: {
        create: [
          {
            productId: product.id,
            itemName: product.name,
            itemSku: product.sku,
            quantity: 2,
            unitPrice: product.price,
            lineTotal: subtotal,
          },
        ],
      },
      productionUnits: {
        create: [
          {
            productId: product.id,
            productName: product.shortName ?? product.name,
            productSku: product.sku,
            batchCode: `L${now.getFullYear()}-001`,
            manufactureDate: now,
            expiryDate: addMonths(now, product.shelfLifeMonths ?? 12),
            ingredients: product.ingredients,
          },
          {
            productId: product.id,
            productName: product.shortName ?? product.name,
            productSku: product.sku,
            batchCode: `L${now.getFullYear()}-002`,
            manufactureDate: now,
            expiryDate: addMonths(now, product.shelfLifeMonths ?? 12),
            ingredients: product.ingredients,
          },
        ],
      },
    },
  });

  console.log(`✓ Pedido creado: ${order.orderNumber} (${order.id})`);
}

main()
  .catch((e) => {
    console.error("✗ Falló:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
