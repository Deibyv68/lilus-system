/**
 * Llena los campos que la tienda necesita: dirección pública y la línea
 * que se lee debajo del nombre en el catálogo.
 *
 *   npx tsx scripts/preparar-tienda.ts           # muestra lo que haría
 *   npx tsx scripts/preparar-tienda.ts --aplicar # lo guarda
 *
 * ── Publicar ──
 *
 * Por defecto no toca `isPublic`. Publicar es un gesto a conciencia y se
 * hace desde el panel, producto por producto, cuando cada uno tiene sus
 * fotos: hay un interruptor «Publicado en la tienda» al lado de «Activo».
 *
 * La excepción es tener algo que mirar mientras se construye la tienda.
 * Para eso está `--publicar-todo`, que es a propósito una bandera aparte
 * y de nombre incómodo: sirve para desarrollo, no para el día a día.
 *
 *   npx tsx scripts/preparar-tienda.ts --aplicar --publicar-todo
 *
 * ── Sobre las direcciones ──
 *
 * El slug sale del nombre, sin tildes y sin eñes, porque es lo que va a
 * quedar escrito en la barra del navegador y en los enlaces que la gente
 * comparte por WhatsApp. `Jabón de Cúrcuma` → `jabon-de-curcuma`.
 *
 * Una vez que un slug sale publicado no se cambia: cualquiera puede
 * haberlo guardado o mandado a alguien. Por eso el script nunca pisa un
 * slug que ya existe — solo llena los vacíos.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** `Jabón de Cúrcuma` → `jabon-de-curcuma` */
function slugificar(texto: string): string {
  return texto
    .normalize("NFD") // separa la letra de su tilde
    .replace(/[̀-ͯ]/g, "") // y borra la tilde que quedó suelta
    .replace(/ñ/gi, "n")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * La línea del catálogo. Sale de la misma reescritura que se hizo para
 * cumplir la Decisión 516, así que ya está en lenguaje permitido: describe
 * qué hace o para quién es, sin prometer que cura nada.
 */
const TAGLINES: Record<string, string> = {
  "LIL-JAB-ARR": "Ayuda a unificar el tono y deja la piel suave",
  "LIL-JAB-CUR": "Aporta luminosidad al tono de la piel",
  "LIL-JAB-CAR": "Para pieles grasas. Limpia en profundidad",
  "LIL-JAB-CAF": "Exfolia suavemente, con café y canela",
  "LIL-JAB-NAR": "Aroma cítrico y sensación de frescura",
  "LIL-JAB-ROM": "Para la higiene diaria de pieles grasas",
  "LIL-JAB-LAV": "Aroma a lavanda, exfolia suavemente",
  "LIL-JAB-ROS": "Deja la piel suave al tacto",
  "LIL-JAB-SAB": "Ayuda a mantener la piel hidratada",
  "LIL-JAB-ALU": "Para axilas y pies. Controla el olor",
  "LIL-JAB-PEP": "Aporta sensación de frescura",
  "LIL-JAB-COC": "Aceite de coco virgen. Deja la piel suave",
  "LIL-JAB-MAR": "Aroma frutal y sensación de frescura",
  "LIL-JAB-MMA": "Manzanilla y miel. Para pieles sensibles",
  "LIL-EXT-AMI": "Limpia el rostro y retira el maquillaje",
  "LIL-EXT-CCN": "Ayuda a mantener la piel suave e hidratada",
  "LIL-EXT-CRB": "Con niacinamida. Ayuda a unificar el tono",
  "LIL-EXT-SHA": "Limpia el cabello y aporta cuerpo",
  "LIL-EXT-ACO": "Desenreda y suaviza el cabello",
  "LIL-EXT-PAC": "El aroma dura más que en base alcohol",
  "LIL-EXT-PVA": "Formato sólido, práctico para viajar",

  // Packs
  "LIL-PACK-LUM": "Cuidado facial: unifica el tono y limpia sin maltratar",
  "LIL-PACK-ENE": "Exfoliación y vitalidad, para empezar la mañana",
  "LIL-PACK-SER": "Relajación de la noche y autocuidado",
  "LIL-PACK-PUR": "Los clásicos, para el cuidado de todos los días",
  "LIL-PACK-VIA": "Los esenciales, en formato de viaje",
};

type Fila = {
  id: string;
  sku: string;
  name: string;
  slug: string | null;
  tagline: string | null;
  isPublic: boolean;
};

/** Devuelve un slug que todavía no esté usado, agregándole -2, -3… si hace falta. */
function slugLibre(base: string, tomados: Set<string>): string {
  let s = base;
  let n = 2;
  while (tomados.has(s)) s = `${base}-${n++}`;
  tomados.add(s);
  return s;
}

async function main() {
  const aplicar = process.argv.includes("--aplicar");
  const publicarTodo = process.argv.includes("--publicar-todo");

  const productos = (await prisma.product.findMany({
    orderBy: { sku: "asc" },
    select: { id: true, sku: true, name: true, slug: true, tagline: true, isPublic: true },
  })) as Fila[];
  const packs = (await prisma.pack.findMany({
    orderBy: { sku: "asc" },
    select: { id: true, sku: true, name: true, slug: true, tagline: true, isPublic: true },
  })) as Fila[];

  // Productos y packs comparten espacio de direcciones: los dos van a
  // colgar de la misma raíz en la tienda, así que un slug repetido entre
  // un producto y un pack sería un choque real.
  const tomados = new Set<string>(
    [...productos, ...packs].map((f) => f.slug).filter((s): s is string => !!s)
  );

  let cambios = 0;

  for (const [tipo, filas] of [
    ["producto", productos],
    ["pack", packs],
  ] as const) {
    for (const f of filas) {
      const slug = f.slug ?? slugLibre(slugificar(f.name), tomados);
      const tagline = f.tagline ?? TAGLINES[f.sku] ?? null;
      const isPublic = publicarTodo ? true : f.isPublic;

      if (slug === f.slug && tagline === f.tagline && isPublic === f.isPublic) continue;
      cambios++;

      console.log(`\n${f.sku}  ${f.name}`);
      if (slug !== f.slug) console.log(`   dirección: /${slug}`);
      if (tagline !== f.tagline) console.log(`   línea:     ${tagline ?? "(sin definir)"}`);
      if (isPublic !== f.isPublic) console.log(`   publicado:  ${isPublic ? "sí" : "no"}`);
      if (!TAGLINES[f.sku]) console.log(`   ⚠ sin línea escrita para este ${tipo}`);

      if (aplicar) {
        const data = { slug, tagline, isPublic };
        if (tipo === "producto") {
          await prisma.product.update({ where: { id: f.id }, data });
        } else {
          await prisma.pack.update({ where: { id: f.id }, data });
        }
      }
    }
  }

  console.log(`\n${cambios} registro(s) a completar.`);
  console.log(
    aplicar
      ? publicarTodo
        ? "Guardado, y todo quedó publicado. Para produccion, despublica lo que no tenga fotos."
        : "Guardado. Ninguno quedó publicado: eso se hace desde el panel."
      : "Nada guardado todavía. Corre con --aplicar para escribirlo."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
