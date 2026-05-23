import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NEW_TEMPLATE =
  "https://www.servientrega.com.ec/Tracking/?guia={tracking}&tipo=GUIA";

async function main() {
  const result = await prisma.carrier.updateMany({
    where: { name: "Servientrega" },
    data: { trackingUrlTemplate: NEW_TEMPLATE },
  });
  console.log(`✓ Servientrega actualizado (${result.count} fila)`);
  console.log(`  Template ahora: ${NEW_TEMPLATE}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
