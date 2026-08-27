/**
 * Cuánto lleva esperando un pedido a que se confirme el pago.
 *
 * ── Por qué existe ──
 *
 * Un pedido en «Pendiente» no es un estado, es una tarea: alguien tiene
 * que abrir el banco y mirar si la transferencia entró. Y esa tarea no se
 * ve — el pedido de hace veinte minutos y el de hace tres días se pintan
 * exactamente igual en la lista.
 *
 * Los que se pierden son siempre los viejos, porque la lista está ordenada
 * por fecha y el más urgente queda abajo, donde nadie baja.
 *
 * ── La cuenta de 48 horas ──
 *
 * La regla es de la casa: si a los dos días no llegó la transferencia, el
 * pedido se cancela. Está escrita en las condiciones de compra, así que
 * el panel debería contar lo mismo que se le prometió al cliente y no
 * cada uno por su lado.
 *
 * No cancela nada solo. Cancelar es una decisión de quien vende —a veces
 * la transferencia llegó y no se vio, a veces la persona avisó que paga el
 * lunes— y un trabajo automático que borra ventas de madrugada es
 * exactamente lo que nadie quiere.
 */

/** Lo que dicen las condiciones de compra. */
export const HORAS_PARA_CANCELAR = 48;

export type NivelDeEspera = "tranquilo" | "atencion" | "vencido";

export type EsperaDePago = {
  horas: number;
  nivel: NivelDeEspera;
  /** Titular corto. Es lo que se lee de un vistazo. */
  aviso: string;
  /** La línea de abajo, con el detalle del tiempo. */
  detalle: string;
};

/**
 * Traduce el rato que lleva esperando a algo que se pueda leer.
 *
 * Devuelve `null` si el pedido no está pendiente: los demás estados ya no
 * esperan a nadie y no necesitan que se les ponga un cartel encima.
 */
export function esperaDePago(
  estado: string,
  creadoEn: Date | string,
  ahora: Date = new Date()
): EsperaDePago | null {
  if (estado !== "PENDING") return null;

  const creado = typeof creadoEn === "string" ? new Date(creadoEn) : creadoEn;
  const horas = Math.max(0, (ahora.getTime() - creado.getTime()) / 3_600_000);
  const restantes = HORAS_PARA_CANCELAR - horas;

  if (restantes <= 0) {
    const dias = Math.floor(horas / 24);
    return {
      horas,
      nivel: "vencido",
      aviso: "Pasaron las 48 horas sin pago",
      detalle:
        `Esperando desde hace ${dias} ${dias === 1 ? "día" : "días"}. ` +
        "Toca cancelarlo o escribirle al cliente.",
    };
  }

  if (restantes <= 12) {
    return {
      horas,
      nivel: "atencion",
      aviso: "Falta confirmar el pago",
      detalle: `Quedan ${Math.ceil(restantes)} h antes de las 48 · conviene escribirle`,
    };
  }

  return {
    horas,
    nivel: "tranquilo",
    aviso: "Falta confirmar el pago",
    detalle: `Revisa si entró la transferencia · quedan ${Math.floor(restantes)} h`,
  };
}

/**
 * «hace 3 h», «hace 2 días».
 *
 * A mano y no con date-fns: son cuatro casos, el texto tiene que ser
 * exactamente este, y así no hay que arrastrar el paquete de idioma a un
 * componente de cliente por una línea de texto.
 */
export function haceCuanto(fecha: Date | string, ahora: Date = new Date()): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  const minutos = Math.floor((ahora.getTime() - d.getTime()) / 60_000);

  if (minutos < 1) return "recién";
  if (minutos < 60) return `hace ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;

  const dias = Math.floor(horas / 24);
  if (dias < 7) return `hace ${dias} ${dias === 1 ? "día" : "días"}`;

  const semanas = Math.floor(dias / 7);
  if (semanas < 5) return `hace ${semanas} ${semanas === 1 ? "semana" : "semanas"}`;

  const meses = Math.floor(dias / 30);
  return `hace ${meses} ${meses === 1 ? "mes" : "meses"}`;
}
