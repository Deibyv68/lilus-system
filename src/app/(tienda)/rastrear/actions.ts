"use server";

import { prisma } from "@/lib/prisma";

/**
 * Buscar un pedido sin tener el enlace a mano.
 *
 * ── Por qué no hay cuentas ──
 *
 * Una cuenta obligaría a guardar contraseñas de clientes, a montar el
 * «olvidé mi contraseña», y a responder por esos datos. Y sobre todo
 * pondría un registro entre la persona y su compra: la mitad de los
 * carritos se abandonan justo ahí.
 *
 * Cada pedido ya nace con un enlace secreto —`publicToken`, 24 bytes al
 * azar— que va en el correo. Esta página es solo la puerta de atrás para
 * quien perdió ese correo.
 *
 * ── Por qué pide dos datos y no solo el número ──
 *
 * Los números son correlativos: LILUS-000006, LILUS-000007. Si bastara el
 * número, cualquiera podría contar de uno en adelante y leer el nombre, la
 * dirección y el teléfono de cada cliente. Pidiendo además el correo o el
 * teléfono con que se hizo la compra, el número por sí solo no abre nada.
 *
 * ── Por qué todos los fallos dicen lo mismo ──
 *
 * Si un pedido inexistente dijera «no existe» y uno real con el correo
 * equivocado dijera «el correo no coincide», ese par de mensajes sería
 * suficiente para averiguar qué números de pedido existen. Se responde lo
 * mismo en los dos casos.
 */

/**
 * Reduce un teléfono a su parte nacional, para poder compararlo.
 *
 * El mismo teléfono se escribe de tres maneras y las tres son correctas:
 *
 *   0963209329        como lo guarda casi todo el mundo en Ecuador
 *   +593 96 320 9329  como lo copia quien lo saca de WhatsApp
 *   963209329         como lo dicta la gente
 *
 * Y la trampa está en que el formato internacional NO lleva el cero: no
 * es «593» pegado delante del número local, es «593» seguido del número
 * sin su cero inicial. Por eso comparar el final de uno con el final del
 * otro falla — «593963209329» no termina en «0963209329» — y por eso hay
 * que quitar el código de país y el cero antes de comparar nada.
 */
function telefonoNacional(s: string): string {
  let d = s.replace(/\D/g, "");
  if (d.startsWith("593")) d = d.slice(3);
  return d.replace(/^0+/, "");
}

/**
 * Normaliza lo que la persona escribió como número de pedido.
 *
 * Acepta «7», «000007», «lilus-000007» o el número con espacios de más:
 * quien copia de un correo en el teléfono arrastra de todo, y rebotarlo
 * por un guion sería quedarse con la razón y sin el cliente.
 */
function normalizarNumero(entrada: string): string | null {
  const limpio = entrada.trim().toUpperCase().replace(/\s+/g, "");
  const digitos = limpio.replace(/^LILUS-?/, "").replace(/\D/g, "");
  if (!digitos) return null;
  return `LILUS-${digitos.padStart(6, "0")}`;
}

export type ResultadoBusqueda =
  | { ok: true; token: string }
  | { ok: false; error: string };

export async function buscarMiPedidoAction(
  formData: FormData
): Promise<ResultadoBusqueda> {
  const numeroCrudo = String(formData.get("numero") ?? "");
  const contacto = String(formData.get("contacto") ?? "").trim();

  if (!numeroCrudo.trim() || !contacto) {
    return { ok: false, error: "Llena los dos campos" };
  }

  const orderNumber = normalizarNumero(numeroCrudo);
  if (!orderNumber) {
    return { ok: false, error: "Ese no parece un número de pedido" };
  }

  const pedido = await prisma.order.findFirst({
    where: { orderNumber },
    select: {
      publicToken: true,
      customer: { select: { email: true, phone: true } },
    },
  });

  /*
    El mismo mensaje para todo lo que falle a partir de acá. Ver arriba.
  */
  const noCuadra: ResultadoBusqueda = {
    ok: false,
    error:
      "No encontramos un pedido con esos datos. Revisa el número y que el " +
      "correo o teléfono sean los mismos con que compraste.",
  };

  if (!pedido?.publicToken) return noCuadra;

  const esCorreo = contacto.includes("@");
  const coincide = esCorreo
    ? pedido.customer?.email?.trim().toLowerCase() === contacto.toLowerCase()
    : (() => {
        const guardado = telefonoNacional(pedido.customer?.phone ?? "");
        const escrito = telefonoNacional(contacto);
        /*
          El mínimo de 7 dígitos es para que «123» no llegue a comparar
          nunca: sin él, un número corto podría coincidir por casualidad
          con el final de uno real.
        */
        if (guardado.length < 7 || escrito.length < 7) return false;
        return guardado === escrito;
      })();

  if (!coincide) return noCuadra;

  return { ok: true, token: pedido.publicToken };
}
