/**
 * Las 24 provincias del Ecuador y sus cantones.
 *
 * ── Por qué va en el código y no en la base ──
 *
 * Esta lista cambia cuando la Asamblea crea una provincia, o sea casi
 * nunca — la última fue Santa Elena, en 2007. Meterla en la base
 * significaría una migración, una pantalla para administrarla, y una
 * consulta más en cada carga del checkout, todo para un dato que en la
 * práctica es constante.
 *
 * ── Por qué importa que sea una lista y no un campo de texto ──
 *
 * Escrito a mano, el mismo lugar llega como «Pichincha», «pichincha»,
 * «PICHINCHA» y «Pichinca». Eso ensucia la base para siempre: buscar los
 * pedidos de una provincia deja de funcionar, y agrupar ventas por zona
 * se vuelve adivinanza. Elegir de una lista lo resuelve de raíz y encima
 * es menos que teclear en un móvil.
 *
 * ── Los cantones, no las parroquias ──
 *
 * Se listan los cantones (218 en total) y no las parroquias, porque el
 * cantón es lo que pide una guía de Servientrega. Bajar a parroquia haría
 * la lista inmanejable sin mejorar la entrega.
 *
 * Para los cantones muy grandes basta el cantón: dentro de Quito, lo que
 * de verdad ubica al repartidor es la calle y la referencia.
 */

export type Provincia = {
  nombre: string;
  cantones: string[];
};

export const PROVINCIAS: Provincia[] = [
  { nombre: "Azuay", cantones: ["Cuenca", "Girón", "Gualaceo", "Nabón", "Paute", "Pucará", "San Fernando", "Santa Isabel", "Sígsig", "Oña", "Chordeleg", "El Pan", "Sevilla de Oro", "Guachapala", "Camilo Ponce Enríquez"] },
  { nombre: "Bolívar", cantones: ["Guaranda", "Chillanes", "Chimbo", "Echeandía", "San Miguel", "Caluma", "Las Naves"] },
  { nombre: "Cañar", cantones: ["Azogues", "Biblián", "Cañar", "La Troncal", "El Tambo", "Déleg", "Suscal"] },
  { nombre: "Carchi", cantones: ["Tulcán", "Bolívar", "Espejo", "Mira", "Montúfar", "San Pedro de Huaca"] },
  { nombre: "Chimborazo", cantones: ["Riobamba", "Alausí", "Colta", "Chambo", "Chunchi", "Guamote", "Guano", "Pallatanga", "Penipe", "Cumandá"] },
  { nombre: "Cotopaxi", cantones: ["Latacunga", "La Maná", "Pangua", "Pujilí", "Salcedo", "Saquisilí", "Sigchos"] },
  { nombre: "El Oro", cantones: ["Machala", "Arenillas", "Atahualpa", "Balsas", "Chilla", "El Guabo", "Huaquillas", "Marcabelí", "Pasaje", "Piñas", "Portovelo", "Santa Rosa", "Zaruma", "Las Lajas"] },
  { nombre: "Esmeraldas", cantones: ["Esmeraldas", "Eloy Alfaro", "Muisne", "Quinindé", "San Lorenzo", "Atacames", "Rioverde", "La Concordia"] },
  { nombre: "Galápagos", cantones: ["San Cristóbal", "Isabela", "Santa Cruz"] },
  { nombre: "Guayas", cantones: ["Guayaquil", "Alfredo Baquerizo Moreno", "Balao", "Balzar", "Colimes", "Daule", "Durán", "El Empalme", "El Triunfo", "Milagro", "Naranjal", "Naranjito", "Palestina", "Pedro Carbo", "Samborondón", "Santa Lucía", "Salitre", "San Jacinto de Yaguachi", "Playas", "Simón Bolívar", "Coronel Marcelino Maridueña", "Lomas de Sargentillo", "Nobol", "General Antonio Elizalde", "Isidro Ayora"] },
  { nombre: "Imbabura", cantones: ["Ibarra", "Antonio Ante", "Cotacachi", "Otavalo", "Pimampiro", "San Miguel de Urcuquí"] },
  { nombre: "Loja", cantones: ["Loja", "Calvas", "Catamayo", "Celica", "Chaguarpamba", "Espíndola", "Gonzanamá", "Macará", "Paltas", "Puyango", "Saraguro", "Sozoranga", "Zapotillo", "Pindal", "Quilanga", "Olmedo"] },
  { nombre: "Los Ríos", cantones: ["Babahoyo", "Baba", "Montalvo", "Puebloviejo", "Quevedo", "Urdaneta", "Ventanas", "Vínces", "Palenque", "Buena Fe", "Valencia", "Mocache", "Quinsaloma"] },
  { nombre: "Manabí", cantones: ["Portoviejo", "Bolívar", "Chone", "El Carmen", "Flavio Alfaro", "Jipijapa", "Junín", "Manta", "Montecristi", "Paján", "Pichincha", "Rocafuerte", "Santa Ana", "Sucre", "Tosagua", "24 de Mayo", "Pedernales", "Olmedo", "Puerto López", "Jama", "Jaramijó", "San Vicente"] },
  { nombre: "Morona Santiago", cantones: ["Morona", "Gualaquiza", "Limón Indanza", "Palora", "Santiago", "Sucúa", "Huamboya", "San Juan Bosco", "Taisha", "Logroño", "Pablo Sexto", "Tiwintza"] },
  { nombre: "Napo", cantones: ["Tena", "Archidona", "El Chaco", "Quijos", "Carlos Julio Arosemena Tola"] },
  { nombre: "Orellana", cantones: ["Orellana", "Aguarico", "La Joya de los Sachas", "Loreto"] },
  { nombre: "Pastaza", cantones: ["Pastaza", "Mera", "Santa Clara", "Arajuno"] },
  { nombre: "Pichincha", cantones: ["Quito", "Cayambe", "Mejía", "Pedro Moncayo", "Rumiñahui", "San Miguel de los Bancos", "Pedro Vicente Maldonado", "Puerto Quito"] },
  { nombre: "Santa Elena", cantones: ["Santa Elena", "La Libertad", "Salinas"] },
  { nombre: "Santo Domingo de los Tsáchilas", cantones: ["Santo Domingo", "La Concordia"] },
  { nombre: "Sucumbíos", cantones: ["Lago Agrio", "Gonzalo Pizarro", "Putumayo", "Shushufindi", "Sucumbíos", "Cascales", "Cuyabeno"] },
  { nombre: "Tungurahua", cantones: ["Ambato", "Baños de Agua Santa", "Cevallos", "Mocha", "Patate", "Quero", "San Pedro de Pelileo", "Santiago de Píllaro", "Tisaleo"] },
  { nombre: "Zamora Chinchipe", cantones: ["Zamora", "Chinchipe", "Nangaritza", "Yacuambi", "Yantzaza", "El Pangui", "Centinela del Cóndor", "Palanda", "Paquisha"] },
];

export const NOMBRES_DE_PROVINCIA = PROVINCIAS.map((p) => p.nombre);

export function cantonesDe(provincia: string): string[] {
  return PROVINCIAS.find((p) => p.nombre === provincia)?.cantones ?? [];
}

/** ¿Existe esa combinación? Se comprueba también en el servidor. */
export function provinciaYCantonValidos(
  provincia: string,
  canton: string
): boolean {
  const cantones = cantonesDe(provincia);
  return cantones.length > 0 && cantones.includes(canton);
}

// ─────────────────────────────────────────────────────────────
// Cédula
// ─────────────────────────────────────────────────────────────

/**
 * ¿Es una cédula ecuatoriana válida?
 *
 * No consulta nada: la cédula lleva su propia comprobación dentro. Los
 * dos primeros dígitos son la provincia (01 a 24, o 30 para quien nació
 * fuera), el tercero es menor que 6 para personas naturales, y el último
 * es un dígito verificador que se calcula con los otros nueve por el
 * algoritmo de módulo 10.
 *
 * Sirve para atrapar el error de tecleo, que es el caso real: un número
 * cambiado de sitio al escribir deprisa. No prueba que la cédula exista
 * ni que sea de quien dice — eso solo lo sabe el Registro Civil.
 *
 * Y por eso el checkout la pide pero no la exige: una guía se despacha
 * igual sin ella, y bloquear una venta por un número que no podemos
 * comprobar de verdad sería cambiar una molestia por una pérdida.
 */
export function cedulaValida(cedula: string): boolean {
  const d = cedula.replace(/\D/g, "");
  if (d.length !== 10) return false;

  const provincia = Number(d.slice(0, 2));
  if (provincia < 1 || (provincia > 24 && provincia !== 30)) return false;

  const tercero = Number(d[2]);
  if (tercero > 5) return false;

  /*
    Módulo 10: los dígitos impares se multiplican por 2 y, si el resultado
    pasa de 9, se le restan 9. Los pares se suman tal cual. El verificador
    es lo que falta para llegar a la siguiente decena.
  */
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let n = Number(d[i]);
    if (i % 2 === 0) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    suma += n;
  }

  const decena = Math.ceil(suma / 10) * 10;
  const verificador = decena - suma === 10 ? 0 : decena - suma;
  return verificador === Number(d[9]);
}

// ─────────────────────────────────────────────────────────────
// Teléfono
// ─────────────────────────────────────────────────────────────

/**
 * Deja el teléfono en su forma nacional: sin código de país ni cero.
 *
 * El mismo número se escribe de tres maneras y las tres son correctas:
 * «0963209329», «+593 96 320 9329» y «963209329». La trampa es que el
 * formato internacional NO lleva el cero — no es «593» pegado delante del
 * local, es «593» seguido del número sin su cero.
 */
export function telefonoNacional(valor: string): string {
  let d = valor.replace(/\D/g, "");
  if (d.startsWith("593")) d = d.slice(3);
  return d.replace(/^0+/, "");
}

/**
 * ¿Sirve para llamar o mandar un WhatsApp?
 *
 * Un celular ecuatoriano son 9 dígitos empezando por 9 (el «09» de
 * siempre, sin el cero). Un fijo son 8, con el código de área delante.
 * Se aceptan los dos: hay clientas que solo dejan el fijo de la casa.
 */
export function telefonoValido(valor: string): boolean {
  const n = telefonoNacional(valor);
  if (n.startsWith("9")) return n.length === 9;
  return n.length === 8;
}

/** «0963209329» — como lo escribe todo el mundo aquí. */
export function telefonoBonito(valor: string): string {
  const n = telefonoNacional(valor);
  if (!n) return "";
  return n.startsWith("9") ? `0${n}` : `0${n}`;
}
