import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, rmSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { AwsClient } from "aws4fetch";

/**
 * Manda una copia de todo a R2, fuera de la laptop.
 *
 *   npx tsx scripts/respaldar-en-r2.ts
 *   npx tsx scripts/respaldar-en-r2.ts --seco    # dice qué haría, sin subir
 *
 * ── Por qué existe ──
 *
 * Los respaldos automáticos de `backup-db.sh` viven en el mismo disco que
 * la base que respaldan. Mientras eso sea así, un disco estropeado se
 * lleva a la vez los pedidos, los clientes, las fotos, los comprobantes de
 * pago Y las ochenta copias de seguridad. No es un susto: es lo único de
 * todo el sistema que no tiene vuelta atrás.
 *
 * Que la web se caiga un rato se arregla encendiendo la laptop. Esto no.
 *
 * ── Qué sube ──
 *
 * La base entera, comprimida y fechada, y los archivos que falten. Los
 * archivos llevan nombre único y no se reescriben nunca, así que basta con
 * preguntar si ya están: lo que existe, existe igual.
 *
 * ── Qué NO hace ──
 *
 * Borrar de R2 lo que ya no esté en el disco. Un respaldo que borra lo que
 * desapareció del origen no es un respaldo: repite el accidente en la
 * copia. Solo se podan las copias viejas de la base, que sí sobran.
 */

const SECO = process.argv.includes("--seco");
const COPIAS_QUE_SE_GUARDAN = 30;

const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID?.trim();
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY?.trim();
const CUENTA = process.env.R2_ACCOUNT_ID?.trim();
const BUCKET = process.env.R2_BUCKET?.trim() || "lilus-archivos";

function carpetaDeDatos(): string {
  const url = process.env.DATABASE_URL ?? "";
  const archivo = url.replace(/^file:/, "").trim();
  if (archivo.startsWith("/") || /^[a-zA-Z]:/.test(archivo)) return path.dirname(archivo);
  return path.resolve(process.cwd(), "prisma", path.dirname(archivo || "."));
}

function rutaDeLaBase(): string {
  const url = process.env.DATABASE_URL ?? "";
  const archivo = url.replace(/^file:/, "").trim();
  if (archivo.startsWith("/") || /^[a-zA-Z]:/.test(archivo)) return archivo;
  return path.resolve(process.cwd(), "prisma", archivo);
}

const cliente = new AwsClient({
  accessKeyId: ACCESS_KEY!,
  secretAccessKey: SECRET_KEY!,
  service: "s3",
  region: "auto",
});

const url = (clave: string) =>
  `https://${CUENTA}.r2.cloudflarestorage.com/${BUCKET}/${clave
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;

async function existe(clave: string): Promise<boolean> {
  const r = await cliente.fetch(url(clave), { method: "HEAD" });
  return r.ok;
}

async function subir(clave: string, bytes: Uint8Array, tipo: string): Promise<void> {
  const r = await cliente.fetch(url(clave), {
    method: "PUT",
    body: bytes.slice().buffer,
    /*
      Content-Length a mano: R2 rechaza con 411 cualquier subida sin ella,
      porque su API no acepta cuerpos troceados.
    */
    headers: { "Content-Type": tipo, "Content-Length": String(bytes.byteLength) },
  });
  if (!r.ok) throw new Error(`R2 rechazó «${clave}»: ${r.status} ${await r.text()}`);
}

/** Todos los archivos bajo una carpeta, con su ruta relativa. */
function listar(raiz: string, prefijo = ""): string[] {
  let entradas;
  try {
    entradas = readdirSync(raiz, { withFileTypes: true });
  } catch {
    return [];
  }
  const salida: string[] = [];
  for (const e of entradas) {
    const rel = prefijo ? `${prefijo}/${e.name}` : e.name;
    if (e.isDirectory()) salida.push(...listar(path.join(raiz, e.name), rel));
    else if (e.isFile()) salida.push(rel);
  }
  return salida;
}

const TIPOS: Record<string, string> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".gif": "image/gif", ".heic": "image/heic",
  ".pdf": "application/pdf",
};

async function respaldarLaBase(): Promise<void> {
  const base = rutaDeLaBase();
  const temporal = mkdtempSync(path.join(tmpdir(), "lilus-respaldo-"));
  const foto = path.join(temporal, "foto.db");

  try {
    /*
      `VACUUM INTO` saca una copia consistente con el servidor en marcha.
      Copiar el archivo a pelo mientras alguien escribe da una base rota, y
      lo peor es que no lo parece hasta que hace falta.
    */
    execFileSync("sqlite3", [base, `VACUUM INTO '${foto}'`]);

    const crudo = readFileSync(foto);
    const comprimido = gzipSync(crudo, { level: 9 });
    const dia = new Date().toISOString().slice(0, 10);
    const clave = `respaldos/base/lilus-${dia}.db.gz`;

    console.log(
      `  base: ${(crudo.length / 1048576).toFixed(1)} MB → ${(comprimido.length / 1024).toFixed(0)} KB comprimidos`
    );

    if (SECO) {
      console.log(`  (seco) subiría ${clave}`);
      return;
    }

    await subir(clave, new Uint8Array(comprimido), "application/gzip");

    /* Se vuelve a bajar y se compara: una copia que no se puede leer no es
       una copia, y esto se descubre el día que hace falta o no se descubre. */
    const r = await cliente.fetch(url(clave));
    const devuelto = new Uint8Array(await r.arrayBuffer());
    const h = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");
    if (!r.ok || h(devuelto) !== h(new Uint8Array(comprimido))) {
      throw new Error(`la copia de la base no coincide al releerla (${clave})`);
    }
    console.log(`  base: subida y verificada → ${clave}`);
  } finally {
    rmSync(temporal, { recursive: true, force: true });
  }
}

async function respaldarLosArchivos(): Promise<void> {
  const zonas = [
    { raiz: path.join(process.cwd(), "public", "uploads"), prefijo: "uploads" },
    { raiz: path.join(carpetaDeDatos(), "comprobantes"), prefijo: "comprobantes" },
  ];

  let subidos = 0, yaEstaban = 0, bytes = 0;

  for (const zona of zonas) {
    for (const rel of listar(zona.raiz)) {
      const clave = `${zona.prefijo}/${rel}`;
      if (await existe(clave)) { yaEstaban++; continue; }

      const ruta = path.join(zona.raiz, rel);
      const contenido = readFileSync(ruta);
      if (SECO) {
        console.log(`  (seco) subiría ${clave} (${statSync(ruta).size} B)`);
        subidos++;
        continue;
      }
      await subir(
        clave,
        new Uint8Array(contenido),
        TIPOS[path.extname(rel).toLowerCase()] ?? "application/octet-stream"
      );
      subidos++;
      bytes += contenido.length;
    }
  }

  console.log(
    `  archivos: ${subidos} nuevos (${(bytes / 1048576).toFixed(1)} MB) · ${yaEstaban} ya estaban`
  );
}

/** Deja solo las copias recientes de la base. Los archivos no se podan. */
async function podar(): Promise<void> {
  let token: string | undefined;
  const claves: string[] = [];
  do {
    const u = new URL(`https://${CUENTA}.r2.cloudflarestorage.com/${BUCKET}`);
    u.searchParams.set("list-type", "2");
    u.searchParams.set("prefix", "respaldos/base/");
    u.searchParams.set("max-keys", "1000");
    if (token) u.searchParams.set("continuation-token", token);
    const r = await cliente.fetch(u.toString());
    if (!r.ok) return;
    const xml = await r.text();
    for (const m of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      const k = m[1].match(/<Key>([^<]+)<\/Key>/)?.[1];
      if (k) claves.push(k);
    }
    token = xml.match(/<NextContinuationToken>([^<]+)</)?.[1];
  } while (token);

  // El nombre lleva la fecha, así que ordenar por nombre ordena por fecha.
  const sobran = claves.sort().slice(0, Math.max(0, claves.length - COPIAS_QUE_SE_GUARDAN));
  for (const k of sobran) {
    if (SECO) { console.log(`  (seco) borraría ${k}`); continue; }
    await cliente.fetch(url(k), { method: "DELETE" });
  }
  console.log(
    `  copias de la base en R2: ${claves.length - sobran.length} (se guardan ${COPIAS_QUE_SE_GUARDAN}, borradas ${sobran.length})`
  );
}

async function main() {
  if (!ACCESS_KEY || !SECRET_KEY || !CUENTA) {
    console.error(
      "Faltan R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY o R2_ACCOUNT_ID. " +
        "Se cargan de .env.r2, que no es el .env de la aplicación: la tienda " +
        "lee del disco y solo el respaldo habla con R2."
    );
    process.exit(1);
  }

  console.log(`respaldo a R2 · ${new Date().toISOString()}${SECO ? " · EN SECO" : ""}`);
  await respaldarLaBase();
  await respaldarLosArchivos();
  await podar();
  console.log("listo");
}

main().catch((e) => {
  console.error("FALLÓ el respaldo:", e.message);
  process.exit(1);
});
