"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { revalidarTienda } from "@/lib/revalidar-tienda";

/**
 * Las cuentas donde se puede recibir el pago.
 *
 * Se ofrecen en la página del pedido dentro de un desplegable: quien
 * compra elige su banco y ve solo los datos de esa cuenta. En Ecuador
 * transferir dentro del mismo banco es inmediato y gratis, y entre bancos
 * distintos tarda y a veces cobra — así que tener varias no es un lujo,
 * es quitar una fricción que cuesta ventas.
 */

type Entrada = {
  banco: string;
  tipo: string;
  numero: string;
  titular: string;
  cedula: string;
  correo: string;
};

function limpiar(formData: FormData): Entrada {
  const t = (k: string) => String(formData.get(k) ?? "").trim();
  return {
    banco: t("banco"),
    tipo: t("tipo"),
    numero: t("numero"),
    titular: t("titular"),
    cedula: t("cedula"),
    correo: t("correo"),
  };
}

function validar(e: Entrada): string | null {
  if (!e.banco) return "Falta el nombre del banco";
  if (!e.numero) return "Falta el número de cuenta";
  /*
    El número se guarda tal como se escribe, con los espacios o guiones
    que traiga: es lo que la persona va a copiar y pegar en su banco, y
    "corregirlo" por nuestra cuenta sería cambiar un dato que no es
    nuestro. Solo se comprueba que tenga dígitos suficientes para ser una
    cuenta y no un descuido.
  */
  if ((e.numero.match(/\d/g)?.length ?? 0) < 6) {
    return "Ese número de cuenta parece incompleto";
  }
  return null;
}

export async function crearCuentaAction(formData: FormData) {
  await requireUser();

  const datos = limpiar(formData);
  const error = validar(datos);
  if (error) return { ok: false as const, error };

  // Va al final: el orden lo decide quien administra, no el azar.
  const ultima = await prisma.cuentaDeCobro.findFirst({
    orderBy: { orden: "desc" },
    select: { orden: true },
  });

  await prisma.cuentaDeCobro.create({
    data: {
      banco: datos.banco,
      tipo: datos.tipo || null,
      numero: datos.numero,
      titular: datos.titular || null,
      cedula: datos.cedula || null,
      correo: datos.correo || null,
      orden: (ultima?.orden ?? 0) + 1,
    },
  });

  revalidatePath("/sistema/configuracion/cuentas");
  revalidarTienda();
  return { ok: true as const };
}

export async function editarCuentaAction(id: string, formData: FormData) {
  await requireUser();

  const datos = limpiar(formData);
  const error = validar(datos);
  if (error) return { ok: false as const, error };

  await prisma.cuentaDeCobro.update({
    where: { id },
    data: {
      banco: datos.banco,
      tipo: datos.tipo || null,
      numero: datos.numero,
      titular: datos.titular || null,
      cedula: datos.cedula || null,
      correo: datos.correo || null,
    },
  });

  revalidatePath("/sistema/configuracion/cuentas");
  revalidarTienda();
  return { ok: true as const };
}

/**
 * Encender o apagar una cuenta.
 *
 * Apagar en vez de borrar: una cuenta que hoy no se usa puede volver el
 * mes que viene, y borrarla obligaría a teclear el número otra vez — que
 * es el dato donde un dígito de menos manda el dinero a otra parte.
 */
export async function alternarCuentaAction(id: string, activa: boolean) {
  await requireUser();
  await prisma.cuentaDeCobro.update({ where: { id }, data: { activa } });
  revalidatePath("/sistema/configuracion/cuentas");
  revalidarTienda();
  return { ok: true as const };
}

export async function borrarCuentaAction(id: string) {
  await requireUser();
  await prisma.cuentaDeCobro.delete({ where: { id } });
  revalidatePath("/sistema/configuracion/cuentas");
  revalidarTienda();
  return { ok: true as const };
}

/** Sube o baja una cuenta en la lista, intercambiándola con su vecina. */
export async function moverCuentaAction(id: string, direccion: "arriba" | "abajo") {
  await requireUser();

  const todas = await prisma.cuentaDeCobro.findMany({
    orderBy: [{ orden: "asc" }, { banco: "asc" }],
    select: { id: true },
  });

  const i = todas.findIndex((c) => c.id === id);
  const j = direccion === "arriba" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= todas.length) return { ok: true as const };

  /*
    Se renumera la lista entera, no solo las dos que se cambian.

    Los `orden` pueden venir repetidos o con huecos, y un intercambio
    suelto en ese caso no cambia nada visible. Numerar de nuevo las pocas
    que hay lo deja siempre consistente.
  */
  const orden = todas.map((c) => c.id);
  [orden[i], orden[j]] = [orden[j], orden[i]];

  await prisma.$transaction(
    orden.map((idCuenta, n) =>
      prisma.cuentaDeCobro.update({ where: { id: idCuenta }, data: { orden: n } })
    )
  );

  revalidatePath("/sistema/configuracion/cuentas");
  revalidarTienda();
  return { ok: true as const };
}
