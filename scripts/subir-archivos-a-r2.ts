import { readdir, readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { guardar, leer, usandoR2, tipoPorExtension } from "../src/lib/almacen";

/**
 * Copia a R2 los archivos que ya viven en el disco de la laptop.
 *
 *   npx tsx scripts/subir-archivos-a-r2.ts            # sube lo que falte
 *   npx tsx scripts/subir-archivos-a-r2.ts --revisar  # solo compara
 *
 * ── No borra nada ──
 *
 * Copia. El disco se queda como está, y sigue siendo la copia buena hasta
 * que la tienda lleve un tiempo sirviendo desde R2 sin quejas. Borrar el
 * original el mismo día que se enciende algo nuevo es cómo se pierden las
 * fotos de un catálogo entero.
 *
 * ── Compara el contenido, no el tamaño ──
 *
 * Dos archivos del mismo tamaño pueden ser distintos: una subida cortada
 * a la mitad y rellenada, un byte cambiado. Se compara el SHA-256 de lo
 * que se lee de vuelta contra el del disco. Cuesta bajarlo otra vez y para
 * una migración que se hace una vez, vale la pena.
 *
 * ── Se puede repetir ──
 *
 * Lo que ya está y coincide se salta. Si se corta a medias, se vuelve a
 * lanzar y sigue donde iba.
 */

const REVISAR = process.argv.includes("--revisar");

function sha(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/** Todos los archivos bajo una carpeta, con su ruta relativa. */
async function listar(raiz: string, prefijo = ""): Promise<string[]> {
  let entradas;
  try {
    entradas = await readdir(raiz, { withFileTypes: true });
  } catch {
    return [];
  }

  const salida: string[] = [];
  for (const e of entradas) {
    const rel = prefijo ? `${prefijo}/${e.name}` : e.name;
    if (e.isDirectory()) salida.push(...(await listar(path.join(raiz, e.name), rel)));
    else if (e.isFile()) salida.push(rel);
  }
  return salida;
}

function carpetaDeDatos(): string {
  const url = process.env.DATABASE_URL ?? "";
  const archivo = url.replace(/^file:/, "").trim();
  if (archivo.startsWith("/") || /^[a-zA-Z]:/.test(archivo)) {
    return path.dirname(archivo);
  }
  return path.resolve(process.cwd(), "prisma", path.dirname(archivo || "."));
}

async function main() {
  if (!usandoR2) {
    console.error(
      "R2 no está configurado. Hacen falta R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY y R2_ACCOUNT_ID."
    );
    process.exit(1);
  }

  const zonas = [
    { raiz: path.join(process.cwd(), "public", "uploads"), prefijo: "uploads" },
    { raiz: path.join(carpetaDeDatos(), "comprobantes"), prefijo: "comprobantes" },
  ];

  let subidos = 0, saltados = 0, malos = 0, bytes = 0;

  for (const zona of zonas) {
    const archivos = await listar(zona.raiz);
    console.log(`\n${zona.prefijo}/ — ${archivos.length} archivos en ${zona.raiz}`);

    for (const rel of archivos) {
      const clave = `${zona.prefijo}/${rel}`;
      const enDisco = await readFile(path.join(zona.raiz, rel));
      const huellaDisco = sha(enDisco);
      const tam = (await stat(path.join(zona.raiz, rel))).size;

      const yaEsta = await leer(clave);
      if (yaEsta && sha(yaEsta.bytes) === huellaDisco) {
        saltados++;
        continue;
      }

      if (REVISAR) {
        console.log(`  falta o difiere: ${clave}`);
        malos++;
        continue;
      }

      await guardar(clave, new Uint8Array(enDisco), tipoPorExtension(rel));

      const devuelto = await leer(clave);
      if (!devuelto || sha(devuelto.bytes) !== huellaDisco) {
        console.log(`  NO COINCIDE tras subir: ${clave}`);
        malos++;
        continue;
      }

      subidos++;
      bytes += tam;
      if (subidos % 10 === 0) console.log(`  ${subidos} subidos…`);
    }
  }

  console.log(
    `\nsubidos: ${subidos} (${(bytes / 1024 / 1024).toFixed(1)} MB) · ya estaban: ${saltados} · problemas: ${malos}`
  );
  process.exit(malos === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("reventó:", e);
  process.exit(1);
});
