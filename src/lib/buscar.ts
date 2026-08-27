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

export type Buscable = { nombre: string; tagline?: string | null };

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
  const descripcion = normalizar(articulo.tagline ?? "");

  return agujas.every(
    (aguja) =>
      nombre.includes(aguja) ||
      (aguja.length >= MINIMO_PARA_DESCRIPCION && descripcion.includes(aguja))
  );
}

/**
 * Filtra y ordena: primero lo que coincide en el nombre.
 *
 * Quien escribe «arroz» busca el jabón de arroz, no la crema cuya línea
 * lo menciona de pasada.
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
