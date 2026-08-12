import fs from "node:fs";
import path from "node:path";

export {
  AV_SECCIONES,
  seccionMeta,
  type AvSeccionId,
  type AvSeccion,
} from "./audiovisual-secciones";

import { AV_SECCIONES } from "./audiovisual-secciones";
import type { AvSeccionId } from "./audiovisual-secciones";

/**
 * La sección audiovisual lee los markdown de LILUS-AUDIOVISUAL/ tal como
 * están en el disco, en vez de copiarlos a la base de datos.
 *
 * El motivo es que esto son documentos, no fichas: nadie los edita desde la
 * app, no hay que consultarlos por relación, y duplicarlos en la base
 * garantizaría que en algún momento la copia y el archivo digan cosas
 * distintas. Editando el .md se actualiza la web sola.
 *
 * El parser es propio y cubre solo lo que estos documentos usan. Es mucho
 * menos que un markdown completo, y a cambio deja convertir los bloques en
 * componentes de verdad: las listas de `[ ]` se vuelven casillas que se
 * marcan, y las tablas se vuelven tablas con scroll propio.
 */

export const AV_RAIZ = "LILUS-AUDIOVISUAL";

// ──────────────────────────────────────────────────────────
// Metadatos por documento
// ──────────────────────────────────────────────────────────

/**
 * Orden y resumen de cada documento. El título sale del propio archivo (su
 * primer `#`); acá solo va lo que el archivo no puede decir de sí mismo.
 *
 * Los que no estén listados igual aparecen, al final de su sección.
 */
const META: Record<string, { orden: number; resumen: string; destacado?: boolean }> = {
  // ── Plan de rodaje ──
  "que-se-fabrica": {
    orden: 1,
    resumen: "3 tandas de jabón y 2 jarras de crema. Cantidades, moldes y qué video alimenta cada una.",
    destacado: true,
  },
  "dos-dias": {
    orden: 2,
    resumen: "El mapa general: qué bloque va cuándo y por qué son dos días y no uno.",
    destacado: true,
  },
  "dia-1-plano-a-plano": {
    orden: 3,
    resumen: "Elaboración, crema y demostraciones. Cada plano con cámara, acción y cuánto rodar.",
    destacado: true,
  },
  "dia-2-plano-a-plano": {
    orden: 4,
    resumen: "Corte y producto terminado. El bucle, las cáusticas y el recetario.",
    destacado: true,
  },
  "antes-de-rodar": {
    orden: 5,
    resumen: "Compras con plazo, utilería y los dos guiones que hay que probar sin cámara.",
  },
  "hoja-de-rodaje": {
    orden: 6,
    resumen: "El resumen de una página, para tener a la vista durante el rodaje.",
  },

  // ── Guiones ──
  "S01-olor-a-huevo-1": { orden: 1, resumen: "Parte 1 de 3. Se plantea el misterio y se corta.", destacado: true },
  "S01-olor-a-huevo-2": { orden: 2, resumen: "Parte 2 de 3. Huevo y pescado: la firma de una proteína rompiéndose." },
  "S01-olor-a-huevo-3": { orden: 3, resumen: "Parte 3 de 3. Era el frasco. Y la pista la dio ella." },
  "G02-colageno-que-no-sirve": {
    orden: 4,
    resumen: "Empieza quitándole valor al propio producto. El cronómetro es todo el argumento.",
    destacado: true,
  },
  "G03-dos-que-se-anulan": { orden: 5, resumen: "Dos líquidos transparentes que al mezclarse se enturbian." },
  "G04-corte-en-silencio": { orden: 6, resumen: "ASMR con carga: el corte revela algo que no se veía." },
  "G05-capas": { orden: 7, resumen: "Estructura invertida: empieza por el final y rebobina." },
  "G06-por-que-suda": { orden: 8, resumen: "Una queja de clientas convertida en prueba de calidad.", destacado: true },
  "G07-el-recetario": { orden: 9, resumen: "El video de origen de la marca. Se rueda una vez y trabaja para siempre." },
  "G08-mal-a-proposito": { orden: 10, resumen: "Se anuncia que se va a arruinar algo, y se arruina." },
  "banco-de-ideas": { orden: 11, resumen: "40 ideas más, con el mecanismo que usaría cada una." },
  README: { orden: 0, resumen: "Cómo leer un guion y los mecanismos de retención que se usan." },

  // ── Producción ──
  "tu-set": {
    orden: 1,
    resumen: "Tu taller de verdad: los tres montajes con tus luces y dónde van las cartulinas.",
    destacado: true,
  },
  vocabulario: { orden: 2, resumen: "Qué quiere decir cada palabra. Empieza por aquí si algo no se entiende.", destacado: true },
  "camara-bmpcc6k": { orden: 3, resumen: "Ajustes, los cuatro problemas conocidos y la pieza que falta." },
  "iluminacion-jabon-transparente": {
    orden: 4,
    resumen: "Por qué el jabón transparente no se ilumina de frente.",
    destacado: true,
  },
  "sonido-asmr": { orden: 5, resumen: "El ASMR se graba aparte. Y el lavalier no es el micrófono para eso." },
  "voz-de-tu-mama": { orden: 6, resumen: "Cómo grabarla con la Focusrite, y por qué no darle un guion para leer.", destacado: true },
  "set-fijo-y-tandas": { orden: 7, resumen: "Cómo sacar 12 videos de un día de rodaje." },

  // ── Estrategia ──
  "el-angulo": { orden: 1, resumen: "Qué hace distinta a LILUS, y la advertencia sobre las vistas de ASMR.", destacado: true },
  "sistema-de-contenido": { orden: 2, resumen: "Los cuatro carriles y las primeras doce semanas." },
  "tendencias-2026": { orden: 3, resumen: "Qué está funcionando ahora, con fuentes." },

  // ── Otros ──
  "flujo-resolve": { orden: 1, resumen: "Sincronizar, reencuadrar de 6K a vertical, color y subtítulos." },
  "lo-que-no-se-puede-decir": {
    orden: 1,
    resumen: "Decisión 516 y ARCSA: la tabla de qué no decir y con qué reemplazarlo.",
    destacado: true,
  },
};

// ──────────────────────────────────────────────────────────
// Bloques
// ──────────────────────────────────────────────────────────

export type AvBloque =
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "checks"; items: string[] }
  | { kind: "cita"; lineas: string[] }
  | { kind: "tabla"; headers: string[]; filas: string[][] }
  | { kind: "pre"; lineas: string[] }
  | { kind: "hr" };

export type AvDoc = {
  slug: string;
  titulo: string;
  resumen: string;
  seccion: AvSeccionId;
  destacado: boolean;
  orden: number;
  bloques: AvBloque[];
  palabras: number;
  minutos: number;
};

// ──────────────────────────────────────────────────────────
// Parser
// ──────────────────────────────────────────────────────────

function esSeparadorDeTabla(linea: string) {
  return /^\|[\s:|-]+\|$/.test(linea.trim());
}

function celdas(linea: string) {
  return linea
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());
}

/** Convierte el markdown de estos documentos en bloques renderizables. */
export function parsear(md: string): { titulo: string; bloques: AvBloque[] } {
  const lineas = md.replace(/\r\n/g, "\n").split("\n");
  const bloques: AvBloque[] = [];
  let titulo = "";
  let i = 0;

  // El párrafo suelto se va acumulando hasta encontrar una línea en blanco
  // o algo que sea claramente otra cosa.
  let parrafo: string[] = [];
  const cerrarParrafo = () => {
    if (parrafo.length) {
      bloques.push({ kind: "p", text: parrafo.join(" ").trim() });
      parrafo = [];
    }
  };

  while (i < lineas.length) {
    const ln = lineas[i];
    const t = ln.trim();

    // Bloque cercado: o es una lista de casillas, o es un diagrama
    if (t.startsWith("```")) {
      cerrarParrafo();
      i++;
      const dentro: string[] = [];
      while (i < lineas.length && !lineas[i].trim().startsWith("```")) {
        dentro.push(lineas[i]);
        i++;
      }
      i++;
      const utiles = dentro.filter((l) => l.trim());
      const todasCasillas =
        utiles.length > 0 && utiles.every((l) => /^\s*\[[ x]\]/i.test(l));
      if (todasCasillas) {
        bloques.push({
          kind: "checks",
          items: utiles.map((l) => l.replace(/^\s*\[[ x]\]\s*/i, "").trim()),
        });
      } else {
        bloques.push({ kind: "pre", lineas: dentro });
      }
      continue;
    }

    if (!t) {
      cerrarParrafo();
      i++;
      continue;
    }

    if (/^---+$/.test(t)) {
      cerrarParrafo();
      bloques.push({ kind: "hr" });
      i++;
      continue;
    }

    if (t.startsWith("#")) {
      cerrarParrafo();
      const nivel = (t.match(/^#+/) ?? ["#"])[0].length;
      const texto = t.replace(/^#+\s*/, "").trim();
      if (nivel === 1 && !titulo) titulo = texto;
      else if (nivel === 2) bloques.push({ kind: "h2", text: texto });
      else if (nivel >= 3) bloques.push({ kind: "h3", text: texto });
      i++;
      continue;
    }

    // Cita: se juntan las líneas seguidas que empiezan con ">"
    if (t.startsWith(">")) {
      cerrarParrafo();
      const dentro: string[] = [];
      let actual: string[] = [];
      while (i < lineas.length && lineas[i].trim().startsWith(">")) {
        const contenido = lineas[i].trim().replace(/^>\s?/, "");
        if (!contenido.trim()) {
          if (actual.length) dentro.push(actual.join(" "));
          actual = [];
        } else {
          actual.push(contenido);
        }
        i++;
      }
      if (actual.length) dentro.push(actual.join(" "));
      bloques.push({ kind: "cita", lineas: dentro });
      continue;
    }

    // Tabla
    if (t.startsWith("|") && i + 1 < lineas.length && esSeparadorDeTabla(lineas[i + 1])) {
      cerrarParrafo();
      const headers = celdas(lineas[i]);
      i += 2;
      const filas: string[][] = [];
      while (i < lineas.length && lineas[i].trim().startsWith("|")) {
        filas.push(celdas(lineas[i]));
        i++;
      }
      bloques.push({ kind: "tabla", headers, filas });
      continue;
    }

    // Listas
    const vinieta = t.match(/^[-*]\s+(.*)$/);
    const numerada = t.match(/^\d+\.\s+(.*)$/);
    if (vinieta || numerada) {
      cerrarParrafo();
      const ordenada = !!numerada;
      const items: string[] = [];
      while (i < lineas.length) {
        const cur = lineas[i];
        const ct = cur.trim();
        const m = ordenada ? ct.match(/^\d+\.\s+(.*)$/) : ct.match(/^[-*]\s+(.*)$/);
        if (m) {
          items.push(m[1]);
          i++;
        } else if (ct && /^\s{2,}\S/.test(cur) && items.length) {
          // continuación indentada del ítem anterior
          items[items.length - 1] += " " + ct;
          i++;
        } else {
          break;
        }
      }
      const casillas = items.every((x) => /^\[[ x]\]/i.test(x));
      if (casillas) {
        bloques.push({
          kind: "checks",
          items: items.map((x) => x.replace(/^\[[ x]\]\s*/i, "")),
        });
      } else {
        bloques.push({ kind: ordenada ? "ol" : "ul", items });
      }
      continue;
    }

    parrafo.push(t);
    i++;
  }
  cerrarParrafo();

  return { titulo, bloques };
}

// ──────────────────────────────────────────────────────────
// Lectura del disco
// ──────────────────────────────────────────────────────────

function contarPalabras(bloques: AvBloque[]) {
  let n = 0;
  for (const b of bloques) {
    if (b.kind === "p" || b.kind === "h2" || b.kind === "h3") n += b.text.split(/\s+/).length;
    else if (b.kind === "ul" || b.kind === "ol" || b.kind === "checks")
      n += b.items.join(" ").split(/\s+/).length;
    else if (b.kind === "cita") n += b.lineas.join(" ").split(/\s+/).length;
    else if (b.kind === "tabla") n += b.filas.flat().join(" ").split(/\s+/).length;
  }
  return n;
}

/**
 * Leer y parsear 30 archivos en cada petición sería tirar trabajo a la
 * basura, así que el resultado se guarda mientras viva el proceso.
 *
 * En desarrollo no se guarda: así, al editar un .md, basta con recargar
 * la página. En producción, en cambio, hay que reiniciar el servicio para
 * que los cambios en los archivos se vean.
 */
let cache: AvDoc[] | null = null;

/** Todos los documentos, ordenados por sección y por orden dentro de ella. */
export function todosLosDocs(): AvDoc[] {
  if (cache && process.env.NODE_ENV === "production") return cache;

  const base = path.join(process.cwd(), AV_RAIZ);
  const docs: AvDoc[] = [];

  for (const seccion of AV_SECCIONES) {
    const dir = path.join(base, seccion.carpeta);
    let archivos: string[] = [];
    try {
      archivos = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
    } catch {
      continue; // la carpeta puede no existir; no es un error
    }

    for (const archivo of archivos) {
      const nombre = archivo.replace(/\.md$/, "");
      const md = fs.readFileSync(path.join(dir, archivo), "utf8");
      const { titulo, bloques } = parsear(md);
      const meta = META[nombre];
      const palabras = contarPalabras(bloques);

      // El README de guiones se llama igual que otros posibles README, así
      // que el slug lleva la sección delante para no chocar.
      const slug =
        nombre === "README" ? `${seccion.id}-guia` : nombre.toLowerCase();

      docs.push({
        slug,
        titulo: titulo || nombre,
        resumen: meta?.resumen ?? "",
        seccion: seccion.id,
        destacado: meta?.destacado ?? false,
        orden: meta?.orden ?? 99,
        bloques,
        palabras,
        minutos: Math.max(1, Math.round(palabras / 200)),
      });
    }
  }

  docs.sort((a, b) => {
    const sa = AV_SECCIONES.findIndex((s) => s.id === a.seccion);
    const sb = AV_SECCIONES.findIndex((s) => s.id === b.seccion);
    if (sa !== sb) return sa - sb;
    if (a.orden !== b.orden) return a.orden - b.orden;
    return a.titulo.localeCompare(b.titulo);
  });

  // Segunda vuelta: los enlaces entre documentos apuntan a rutas de archivo
  // y hay que traducirlos a rutas de la app. Va aquí y no en el parser
  // porque para resolverlos hacen falta todos los documentos ya cargados.
  const porSlug = new Map(docs.map((d) => [d.slug, d]));
  const aSlug = (nombre: string) =>
    nombre === "README" ? "guiones-guia" : nombre.toLowerCase();

  /**
   * Reescribe `[texto](archivo.md)` a `[texto](/audiovisual/slug)`.
   *
   * Además, cuando el texto visible del enlace es el nombre del archivo
   * —que en los .md es lo natural y ahí se lee bien— se cambia por el
   * título del documento: en la web, "vocabulario.md" se lee como una
   * ruta que se escapó, no como un enlace.
   */
  const arreglar = (txt: string) =>
    txt.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (todo, texto: string, href: string) => {
      if (/^https?:/.test(href) || href.startsWith("/")) return todo;
      const m = href.match(/([^/]+)\.md(#.*)?$/);
      if (!m) return texto; // enlace a una carpeta: se queda el texto solo
      const destino = porSlug.get(aSlug(m[1]));
      if (!destino) return texto;
      const visible = /\.md$/i.test(texto.trim()) ? destino.titulo : texto;
      return `[${visible}](/audiovisual/${destino.slug})`;
    });

  for (const doc of docs) {
    for (const b of doc.bloques) {
      if (b.kind === "p" || b.kind === "h2" || b.kind === "h3") b.text = arreglar(b.text);
      else if (b.kind === "ul" || b.kind === "ol" || b.kind === "checks")
        b.items = b.items.map(arreglar);
      else if (b.kind === "cita") b.lineas = b.lineas.map(arreglar);
      else if (b.kind === "tabla") b.filas = b.filas.map((f) => f.map(arreglar));
    }
  }

  cache = docs;
  return docs;
}

export function docPorSlug(slug: string) {
  return todosLosDocs().find((d) => d.slug === slug) ?? null;
}

export function docsDeSeccion(id: AvSeccionId) {
  return todosLosDocs().filter((d) => d.seccion === id);
}

/** El anterior y el siguiente dentro de la misma sección, para navegar. */
export function vecinos(slug: string) {
  const doc = docPorSlug(slug);
  if (!doc) return { anterior: null, siguiente: null };
  const hermanos = docsDeSeccion(doc.seccion);
  const i = hermanos.findIndex((d) => d.slug === slug);
  return {
    anterior: i > 0 ? hermanos[i - 1] : null,
    siguiente: i >= 0 && i < hermanos.length - 1 ? hermanos[i + 1] : null,
  };
}
