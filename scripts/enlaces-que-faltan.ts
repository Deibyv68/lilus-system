/**
 * Darle su enlace público a los pedidos que nacieron sin él.
 *
 * Los cargados a mano desde el panel se creaban sin token, así que su
 * página de seguimiento no existía: para verla había que entrar por «Mi
 * pedido» tecleando número y correo, y para eso alguien tenía que
 * explicárselo a la clienta.
 *
 * Desde ahora todos nacen con el suyo. Esto es para los de antes.
 *
 * Se puede correr dos veces sin miedo: solo toca los que están en nulo, y
 * jamás reemplaza uno existente — el token que ya circula por WhatsApp
 * tiene que seguir funcionando.
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";

const prisma = new PrismaClient();

async function main() {
  const sinEnlace = await prisma.order.findMany({
    where: { publicToken: null },
    select: { id: true, orderNumber: true, source: true },
    orderBy: { createdAt: "asc" },
  });

  if (sinEnlace.length === 0) {
    console.log("Todos los pedidos ya tienen su enlace.");
    return;
  }

  for (const pedido of sinEnlace) {
    await prisma.order.update({
      where: { id: pedido.id },
      data: { publicToken: randomBytes(24).toString("base64url") },
    });
    console.log(`  ${pedido.orderNumber} (${pedido.source ?? "sin origen"})`);
  }

  console.log(`\n${sinEnlace.length} pedido(s) con enlace nuevo.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
