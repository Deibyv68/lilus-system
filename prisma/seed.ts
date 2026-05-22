import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Zonas de envío
  const quito = await prisma.shippingZone.upsert({
    where: { name: "Quito" },
    update: {},
    create: { name: "Quito", isDefault: true },
  });

  const fueraQuito = await prisma.shippingZone.upsert({
    where: { name: "Fuera de Quito" },
    update: {},
    create: { name: "Fuera de Quito" },
  });

  // Transportadora inicial
  const servientrega = await prisma.carrier.upsert({
    where: { name: "Servientrega" },
    update: {},
    create: { name: "Servientrega" },
  });

  // Tarifas por defecto (editables luego en /envios)
  await prisma.shippingRate.upsert({
    where: { zoneId_carrierId: { zoneId: quito.id, carrierId: servientrega.id } },
    update: {},
    create: { zoneId: quito.id, carrierId: servientrega.id, price: 3.5 },
  });

  await prisma.shippingRate.upsert({
    where: { zoneId_carrierId: { zoneId: fueraQuito.id, carrierId: servientrega.id } },
    update: {},
    create: { zoneId: fueraQuito.id, carrierId: servientrega.id, price: 5.5 },
  });

  // Configuración global
  await prisma.setting.upsert({
    where: { key: "brand_name" },
    update: { value: "LILUS" },
    create: { key: "brand_name", value: "LILUS" },
  });

  await prisma.setting.upsert({
    where: { key: "sender_name" },
    update: { value: "LILUS Jabones Artesanales" },
    create: { key: "sender_name", value: "LILUS Jabones Artesanales" },
  });

  await prisma.setting.upsert({
    where: { key: "sender_phone" },
    update: { value: "" },
    create: { key: "sender_phone", value: "" },
  });

  await prisma.setting.upsert({
    where: { key: "sender_address" },
    update: { value: "Quito, Ecuador" },
    create: { key: "sender_address", value: "Quito, Ecuador" },
  });

  await prisma.setting.upsert({
    where: { key: "order_prefix" },
    update: { value: "LILUS" },
    create: { key: "order_prefix", value: "LILUS" },
  });

  console.log("Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
