/**
 * Cuánto se ha pagado de un pedido, y cuánto falta.
 *
 * ── La regla que gobierna todo este archivo ──
 *
 * Solo suma lo que una persona aceptó. Lo que leyó el OCR se cuenta
 * aparte y nunca entra en el total pagado, por bien que se vea.
 *
 * No es desconfianza en el OCR, es que un comprobante es una imagen y una
 * imagen se edita en dos minutos. Si la máquina pudiera dar un pedido por
 * pagado, la forma de robar sería editar un número en el teléfono. Con
 * esta separación, lo peor que consigue una imagen falsa es que alguien
 * la mire y diga que no.
 *
 * ── Por qué un pago parcial no es un error ──
 *
 * Aquí la gente abona: manda la mitad hoy y la otra mitad cuando cobra, o
 * transfiere desde dos cuentas porque una tiene límite diario. Tratar eso
 * como «no cuadra» convierte una venta normal en una alarma, y a la
 * tercera alarma falsa nadie las mira.
 *
 * Por eso lo que falta es un número, no un aviso: «faltan $13,50» dice
 * qué hacer. «No cuadra» solo dice que algo pasa.
 *
 * Vive fuera de los componentes y sin dependencias para poder probarlo:
 * es aritmética de dinero, y ahí un error no se ve hasta que alguien
 * reclama.
 */

export type ComprobanteParaContar = {
  /** Nulo mientras nadie lo ha revisado. */
  aceptado: boolean | null;
  /** Lo que dijo quien revisó. Es lo único que suma. */
  montoConfirmado: number | null;
  /**
   * Lo que creyó leer la máquina. Solo informa, nunca suma.
   *
   * Opcional a propósito: la página del cliente no lo pide a la base, para
   * que no exista ni la tentación de enseñárselo. Sin él, `dicenPorRevisar`
   * sale en cero — que es exactamente lo que debe ver quien compró.
   */
  montoLeido?: number | null;
};

export type EstadoDePago = {
  /** Suma de los comprobantes aceptados. */
  confirmado: number;
  /** Lo que queda por cubrir. Nunca negativo. */
  falta: number;
  /** Lo que se pagó de más, si se pagó de más. Nunca negativo. */
  sobra: number;
  /** El confirmado cubre el total, con un centavo de margen. */
  cuadra: boolean;
  /** Cuántos comprobantes esperan que alguien los mire. */
  porRevisar: number;
  /** Lo que suman los que esperan, según el OCR. Solo para orientar. */
  dicenPorRevisar: number;
  /** Cuántos se revisaron y se decidió que no cuentan. */
  descartados: number;
  /** Si hay al menos un comprobante subido. */
  hayComprobantes: boolean;
};

/*
  Todo se redondea a centavos antes de comparar.

  Sumar 8.50 + 17.00 en coma flotante puede dar 25.499999999999996, y
  comparar eso con 25.50 diría que falta medio centavo — un pedido que
  nunca termina de cuadrar por un decimal que nadie ve.
*/
function centavos(n: number): number {
  return Math.round(n * 100);
}

export function estadoDePago(
  comprobantes: ComprobanteParaContar[],
  total: number
): EstadoDePago {
  let confirmadoC = 0;
  let porRevisar = 0;
  let dicenC = 0;
  let descartados = 0;

  for (const c of comprobantes) {
    if (c.aceptado === true) {
      confirmadoC += centavos(c.montoConfirmado ?? 0);
    } else if (c.aceptado === false) {
      descartados += 1;
    } else {
      porRevisar += 1;
      dicenC += centavos(c.montoLeido ?? 0);
    }
  }

  const totalC = centavos(total);
  const diferencia = totalC - confirmadoC;

  return {
    confirmado: confirmadoC / 100,
    falta: Math.max(0, diferencia) / 100,
    sobra: Math.max(0, -diferencia) / 100,
    /*
      Un centavo de margen. El OCR confunde un 0 con un 8 de vez en
      cuando, pero sobre todo hay bancos que redondean la comisión y
      dejan una diferencia de un centavo que no significa nada.
    */
    cuadra: diferencia <= 1,
    porRevisar,
    dicenPorRevisar: dicenC / 100,
    descartados,
    hayComprobantes: comprobantes.length > 0,
  };
}
