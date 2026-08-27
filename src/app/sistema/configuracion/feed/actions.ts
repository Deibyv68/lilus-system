"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { saveUpload } from "@/lib/uploads";
import { revalidarTienda } from "@/lib/revalidar-tienda";

/**
 * Las fotos del feed de la portada.
 *
 * Se suben a mano en vez de traerse de Instagram o TikTok. Las dos APIs
 * exigen registrar una aplicación, que la cuenta sea de empresa, y un
 * token que caduca cada dos meses: el día que nadie lo renueve la portada
 * se queda con un hueco y nadie se entera hasta que un cliente lo dice.
 * Subir unas fotos cada tanto es más trabajo una vez y cero
 * mantenimiento.
 */

export async function subirFotoFeedAction(formData: FormData) {
  await requireUser();

  const archivo = formData.get("foto");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { ok: false as const, error: "Elige una foto" };
  }

  let url: string;
  try {
    url = await saveUpload(archivo, "feed", "image");
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }

  // Va al final: el orden lo decide quien sube, no el azar.
  const ultima = await prisma.feedImagen.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await prisma.feedImagen.create({
    data: {
      url,
      alt: String(formData.get("alt") ?? "").trim() || null,
      enlace: String(formData.get("enlace") ?? "").trim() || null,
      sortOrder: (ultima?.sortOrder ?? 0) + 1,
    },
  });

  revalidatePath("/sistema/configuracion/feed");
  revalidarTienda();
  return { ok: true as const };
}

export async function borrarFotoFeedAction(id: string) {
  await requireUser();

  /*
   * Se borra la fila, no el archivo del disco.
   *
   * El respaldo de `deploy/backup-db.sh` guarda `public/uploads` sin
   * borrar nada: es un baúl, para que una foto quitada por error siga
   * estando. Borrar el archivo aquí rompería eso — y una imagen suelta en
   * disco no le hace daño a nadie.
   */
  await prisma.feedImagen.delete({ where: { id } });

  revalidatePath("/sistema/configuracion/feed");
  revalidarTienda();
  return { ok: true as const };
}

/** Sube o baja una foto en el orden, intercambiándola con su vecina. */
export async function moverFotoFeedAction(id: string, direccion: "arriba" | "abajo") {
  await requireUser();

  const todas = await prisma.feedImagen.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: { id: true, sortOrder: true },
  });

  const i = todas.findIndex((f) => f.id === id);
  const j = direccion === "arriba" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= todas.length) return { ok: true as const };

  /*
   * Se reescribe el orden entero, no solo el de las dos.
   *
   * Los `sortOrder` pueden venir repetidos o con huecos —el de por
   * defecto es 0 para todas— y un intercambio suelto en ese caso no
   * cambia nada visible. Numerar de nuevo las pocas que hay lo deja
   * siempre consistente.
   */
  const orden = todas.map((f) => f.id);
  [orden[i], orden[j]] = [orden[j], orden[i]];

  await prisma.$transaction(
    orden.map((idFoto, n) =>
      prisma.feedImagen.update({ where: { id: idFoto }, data: { sortOrder: n } })
    )
  );

  revalidatePath("/sistema/configuracion/feed");
  revalidarTienda();
  return { ok: true as const };
}
