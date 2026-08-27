"use server";

import { prisma } from "@/lib/prisma";
import { ipDe, puedeIntentar, anotarFalloDeEntrada } from "@/lib/frenar-intentos";
import { headers } from "next/headers";

/**
 * El formulario de contacto.
 *
 * ── Por qué guarda en vez de mandar un correo ──
 *
 * Un formulario que solo envía correo depende de que el SMTP esté
 * configurado, de que no caiga en spam y de que nadie borre el hilo. Si
 * algo de eso falla, el mensaje se pierde y nadie se entera — ni quien
 * escribió, que se queda esperando respuesta.
 *
 * Guardado en la base, el mensaje existe pase lo que pase, y se ve en el
 * panel. El aviso por correo se suma cuando esté configurado.
 *
 * ── Sobre el correo del que escribe ──
 *
 * Se guarda para poder contestar, y nada más. No entra en la tabla de
 * clientes ni en ninguna lista: quien escribe una pregunta no está
 * pidiendo que lo apunten en nada.
 */

const LIMITES = {
  nombre: 80,
  correo: 120,
  mensaje: 2000,
};

export type ResultadoContacto =
  | { ok: true }
  | { ok: false; error: string };

export async function enviarMensajeAction(
  formData: FormData
): Promise<ResultadoContacto> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const correo = String(formData.get("correo") ?? "").trim();
  const mensaje = String(formData.get("mensaje") ?? "").trim();

  /*
    El campo trampa.

    Está en el formulario pero escondido a la vista y fuera del recorrido
    del teclado, así que una persona no puede llenarlo ni sin querer. Los
    programas que rellenan formularios automáticamente sí lo llenan,
    porque leen el HTML y no la pantalla.
  */
  if (String(formData.get("web") ?? "")) {
    // Se responde que sí para no enseñarle al robot cómo evitarlo.
    return { ok: true };
  }

  if (!nombre || !correo || !mensaje) {
    return { ok: false, error: "Llena los tres campos" };
  }
  if (!correo.includes("@") || correo.length > LIMITES.correo) {
    return { ok: false, error: "Ese correo no parece válido" };
  }
  if (nombre.length > LIMITES.nombre) {
    return { ok: false, error: "El nombre es demasiado largo" };
  }
  if (mensaje.length > LIMITES.mensaje) {
    return {
      ok: false,
      error: `El mensaje es muy largo. Máximo ${LIMITES.mensaje} caracteres.`,
    };
  }

  /*
    El mismo freno que el login, con la llave del formulario.

    Sin esto, un solo programa puede dejar diez mil mensajes en una noche
    y llenar la base y el panel de basura. Cuatro mensajes seguidos son
    gratis; a partir de ahí hay que esperar, y la espera crece.
  */
  const ip = ipDe(await headers());
  const llave = `contacto:${ip}`;
  const freno = await puedeIntentar(llave, ip);
  if (freno.bloqueado) {
    return {
      ok: false,
      error: "Ya mandaste varios mensajes seguidos. Espera un momento.",
    };
  }
  await anotarFalloDeEntrada(llave, ip);

  await prisma.mensajeDeContacto.create({
    data: { nombre, correo, mensaje },
  });

  return { ok: true };
}
