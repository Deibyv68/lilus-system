/**
 * Los colores de la app.
 *
 * Los mismos del panel web, para que abrir una y otra no se sienta como
 * cambiar de sistema. En particular los de estado: ámbar es «esto espera
 * algo de ti», verde es «terminado», rojo es «se cayó». Se lee antes que
 * la palabra, y tiene que significar lo mismo en las dos pantallas.
 */

export const C = {
  fondo: "#ffffff",
  fondoAlt: "#fafaf9",
  texto: "#1c1917",
  tenue: "#78716c",
  linea: "#e7e5e4",
  primario: "#1c1917",
  sobrePrimario: "#fafaf9",
  destructivo: "#dc2626",
} as const;

/** Fondo y texto de cada estado, calcados de `src/lib/estados-pedido.ts`. */
export const COLOR_ESTADO: Record<string, { fondo: string; texto: string }> = {
  PENDING: { fondo: "#fef3c7", texto: "#92400e" },
  PAID: { fondo: "#dbeafe", texto: "#1e40af" },
  PACKED: { fondo: "#f3e8ff", texto: "#6b21a8" },
  SHIPPED: { fondo: "#e0e7ff", texto: "#3730a3" },
  DELIVERED: { fondo: "#dcfce7", texto: "#166534" },
  CANCELLED: { fondo: "#fee2e2", texto: "#991b1b" },
};

export const COLOR_ESPERA = {
  tranquilo: { fondo: "#fffbeb", borde: "#fcd34d", texto: "#92400e" },
  atencion: { fondo: "#fff7ed", borde: "#fb923c", texto: "#9a3412" },
  vencido: { fondo: "#fef2f2", borde: "#f87171", texto: "#991b1b" },
} as const;

export function colorDeEstado(estado: string) {
  return COLOR_ESTADO[estado] ?? { fondo: "#f5f5f4", texto: "#57534e" };
}

/** `$25,50` — el mismo formato que el panel. */
export function money(n: number): string {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

/**
 * «hace 3 h».
 *
 * Copia de `haceCuanto` del servidor. Se repite acá porque el texto se
 * refresca solo mientras la pantalla está abierta, y pedirle al servidor
 * una lista nueva cada minuto para cambiar dos palabras sería absurdo.
 * El plazo de las 48 horas sí lo calcula el servidor: ese depende de una
 * regla de negocio y no puede depender del reloj del teléfono.
 */
export function haceCuanto(fechaIso: string, ahora = new Date()): string {
  const minutos = Math.floor(
    (ahora.getTime() - new Date(fechaIso).getTime()) / 60_000
  );
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
