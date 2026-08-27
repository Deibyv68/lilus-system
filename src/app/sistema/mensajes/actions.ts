"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";

/** Marcar leído o no leído. Es un interruptor, no un camino de ida. */
export async function marcarMensajeAction(id: string, leido: boolean) {
  await requireUser();
  await prisma.mensajeDeContacto.update({ where: { id }, data: { leido } });
  revalidatePath("/sistema/mensajes");
  return { ok: true as const };
}

export async function borrarMensajeAction(id: string) {
  await requireUser();
  await prisma.mensajeDeContacto.delete({ where: { id } });
  revalidatePath("/sistema/mensajes");
  return { ok: true as const };
}
