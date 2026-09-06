/**
 * Comprueba que la base responde igual por los dos caminos.
 *
 *   npx tsx scripts/probar-base.ts                          # archivo local
 *   TURSO_DATABASE_URL=... npx tsx scripts/probar-base.ts   # por red
 *
 * No basta con leer: los adaptadores de Prisma suelen fallar justo en lo
 * que esta tienda mas necesita —la transaccion del checkout, que crea
 * pedido, cliente y lineas de una pieza—. Por eso aqui se escribe, se
 * hace una transaccion, se provoca un fallo a proposito y se comprueba
 * que el rollback dejo las cosas como estaban.
 *
 * Escribe y borra una fila de Setting con una clave que nadie mas usa.
 */

import { prisma, usandoTurso } from "../src/lib/prisma";

/* El cliente que reciben las transacciones: el mismo, sin los metodos que
   no valen dentro de una. */
type PrismaTx = Omit<typeof prisma, "$transaction" | "$connect" | "$disconnect" | "$on" | "$use" | "$extends">;

const CLAVE = "__prueba_adaptador__";

async function main() {
  console.log("usandoTurso:", usandoTurso);

  await prisma.setting.upsert({
    where: { key: CLAVE },
    create: { key: CLAVE, value: "uno" },
    update: { value: "uno" },
  });
  console.log("escritura simple: ok");

  // Transacción interactiva: es lo que usa el checkout para crear el
  // pedido, el cliente y las líneas sin dejar nada a medias.
  const n = await prisma.$transaction(async (tx: PrismaTx) => {
    await tx.setting.update({ where: { key: CLAVE }, data: { value: "dos" } });
    return tx.setting.count({ where: { key: CLAVE } });
  });
  console.log("transaccion interactiva: ok, filas:", n);

  const leido = await prisma.setting.findUnique({ where: { key: CLAVE } });
  console.log("valor tras la transaccion:", leido?.value);

  // Y que una transacción que falla no deje rastro.
  try {
    await prisma.$transaction(async (tx: PrismaTx) => {
      await tx.setting.update({ where: { key: CLAVE }, data: { value: "tres" } });
      throw new Error("a proposito");
    });
  } catch { /* esperado */ }
  const tras = await prisma.setting.findUnique({ where: { key: CLAVE } });
  console.log("tras el rollback (deberia decir dos):", tras?.value);

  await prisma.setting.delete({ where: { key: CLAVE } });
  console.log("borrado: ok");
}

main()
  .catch((e) => { console.error("FALLO:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
