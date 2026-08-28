/**
 * Cómo se busca en la tienda.
 *
 * Vive aparte y sin dependencias porque lo usan los dos sitios donde se
 * busca: la capa del buscador, que filtra en el navegador, y la página de
 * catálogo, que filtra en el servidor. Si cada una tuviera su copia,
 * escribir lo mismo en una y en otra daría resultados distintos.
 */

/** Sin tildes: escribir sin ellas en el teléfono es lo normal. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Desde cuántas letras una palabra puede buscarse también en la línea de
 * catálogo, además de en el nombre.
 *
 * Existe por un caso concreto: escribir «jabon la» devolvía seis jabones,
 * porque «la» aparece dentro de «deja la piel suave» en media docena de
 * líneas. Las palabras cortas son artículos y preposiciones, y buscarlas
 * en el texto descriptivo no acerca a nada — solo mete ruido justo
 * mientras alguien está tecleando el nombre que quiere.
 */
const MINIMO_PARA_DESCRIPCION = 4;

/**
 * Lo que se busca de cada artículo.
 *
 * `ingredientes` es el resumen de lo principal que lleva —«Carbón
 * activado, arcillas bentonita y verde, árbol de té»— y no la lista
 * completa de la etiqueta. Es lo que hace que buscar «romero» encuentre
 * los cuatro jabones que lo llevan y no solo el que se llama así.
 *
 * En un pack viene compuesto de lo que lleva dentro, porque quien busca
 * «avena» quiere que también le salga el pack donde va el jabón de avena.
 */
export type Buscable = {
  nombre: string;
  tagline?: string | null;
  ingredientes?: string | null;
};

/** Parte la consulta en palabras ya normalizadas. */
export function terminos(consulta: string): string[] {
  return normalizar(consulta.trim()).split(/\s+/).filter(Boolean);
}

/**
 * ¿Coincide? Tienen que coincidir TODAS las palabras: «jabon lavanda» no
 * debería devolver los catorce jabones.
 */
export function coincide(articulo: Buscable, agujas: string[]): boolean {
  if (agujas.length === 0) return true;

  const nombre = normalizar(articulo.nombre);
  /*
    La línea de catálogo y el resumen de ingredientes se buscan juntos, y
    los dos con el mismo mínimo de letras: los dos son texto corrido, y en
    los dos «la» o «de» aparecen en casi todos los artículos.
  */
  const texto = normalizar(
    `${articulo.tagline ?? ""} ${articulo.ingredientes ?? ""}`
  );

  return agujas.every(
    (aguja) =>
      nombre.includes(aguja) ||
      (aguja.length >= MINIMO_PARA_DESCRIPCION && texto.includes(aguja))
  );
}

/**
 * Por qué salió este resultado, cuando no fue por el nombre.
 *
 * Buscar «romero» y que aparezca el «Jabón de Lavanda» es correcto —lo
 * lleva— pero desconcierta si no se dice. Devuelve el trozo del resumen
 * de ingredientes donde está la palabra, para poder enseñarlo debajo.
 *
 * Devuelve `null` si el nombre ya explica la coincidencia: ahí no hay
 * nada que aclarar.
 */
export function porQueCoincide(
  articulo: Buscable,
  consulta: string
): string | null {
  const agujas = terminos(consulta);
  if (agujas.length === 0) return null;

  const nombre = normalizar(articulo.nombre);
  const enElNombre = agujas.filter((a) => nombre.includes(a));
  if (enElNombre.length === agujas.length) return null;

  const resumen = articulo.ingredientes ?? "";
  if (!resumen.trim()) return null;

  /*
    Se busca la frase del resumen que contiene la palabra, no el resumen
    entero: «Romero, ortiga, aceite de ricino. Refresca el cuero
    cabelludo» son dos ideas, y solo la primera explica por qué salió.
  */
  const frases = resumen
    .split(/(?<=[.;])\s+/)
    .map((f) => f.trim())
    .filter(Boolean);

  const faltaba = agujas.filter((a) => !nombre.includes(a));
  const frase = frases.find((f) =>
    faltaba.some(
      (a) => a.length >= MINIMO_PARA_DESCRIPCION && normalizar(f).includes(a)
    )
  );

  return frase ?? null;
}

/**
 * Filtra y ordena: primero lo que coincide en el nombre.
 *
 * Quien escribe «arroz» busca el jabón de arroz, no la crema que lo lleva
 * como tercer ingrediente. Los que lo llevan salen igual, pero después.
 */
export function filtrar<T extends Buscable>(lista: T[], consulta: string): T[] {
  const agujas = terminos(consulta);
  if (agujas.length === 0) return lista;

  const encontrados = lista.filter((a) => coincide(a, agujas));

  return encontrados.sort((a, b) => {
    const puntos = (x: T) =>
      agujas.filter((aguja) => normalizar(x.nombre).includes(aguja)).length;
    return puntos(b) - puntos(a);
  });
}
