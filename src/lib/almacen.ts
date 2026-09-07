import "server-only";
import { mkdir, writeFile, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { AwsClient } from "aws4fetch";

/**
 * Dónde viven los archivos: el disco de la laptop, o R2.
 *
 * ── Por qué hace falta esto ──
 *
 * Hasta ahora las fotos de los productos y los comprobantes de pago
 * vivían en el disco de la laptop. Eso ata la tienda a que la laptop esté
 * encendida: sin ella no hay fotos que mostrar, y una clienta no puede
 * subir la captura de su transferencia.
 *
 * R2 es el almacén de Cloudflare. Poniendo los archivos ahí, la tienda
 * puede correr fuera de casa y seguir aceptando compras de madrugada.
 *
 * ── Las dos zonas, y por qué siguen separadas ──
 *
 * `uploads/` es lo que se enseña: fotos de productos y packs, PDF de
 * etiquetas. `comprobantes/` es lo que no: llevan el nombre de quien
 * pagó, su banco y su número de cuenta.
 *
 * En el disco son dos carpetas distintas —una dentro de `public`, la otra
 * junto a la base para que los respaldos se la lleven— y esa separación
 * se conserva tal cual. En R2 son dos prefijos del mismo bucket, que no
 * tiene acceso público: a los dos se llega solo por las rutas que los
 * sirven, y la de comprobantes pide sesión.
 *
 * Mantener la misma forma de clave en los dos sitios es lo que permite
 * cambiar de uno a otro sin tocar ni una dirección ya guardada en la base.
 *
 * ── Se elige solo ──
 *
 * Con `R2_ACCESS_KEY_ID` puesta, va a R2. Sin ella, al disco, exactamente
 * como antes. Se prueba —y se deshace— borrando una línea del `.env`.
 */

export type Archivo = { bytes: Uint8Array; tipo: string; tamano: number };

const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID?.trim();
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY?.trim();
const CUENTA = process.env.R2_ACCOUNT_ID?.trim();
const BUCKET = process.env.R2_BUCKET?.trim() || "lilus-archivos";

export const usandoR2 = Boolean(ACCESS_KEY && SECRET_KEY && CUENTA);

/* ─────────────────────────── El disco ─────────────────────────── */

/**
 * Dónde cae cada clave en el disco.
 *
 * Las dos zonas viven en sitios distintos y así se queda: mover los
 * comprobantes dentro de `public` los dejaría servibles por cualquiera en
 * cuanto el servidor se reiniciara, que es justo lo que `comprobantes.ts`
 * explica que hay que evitar.
 */
function rutaEnDisco(clave: string): string {
  if (clave.startsWith("comprobantes/")) {
    return path.join(carpetaDeDatos(), clave);
  }
  return path.join(process.cwd(), "public", clave);
}

/**
 * La carpeta donde está la base, sacada de `DATABASE_URL`.
 *
 * Los comprobantes se guardan al lado del archivo de la base para que
 * cualquier respaldo de esa carpeta se los lleve: separar el comprobante
 * del pedido al que pertenece sería guardar la mitad de la prueba de un
 * pago.
 *
 * Con la base en Turso ya no hay archivo del que sacar la carpeta, así
 * que se cae a `prisma/`. Da igual: para cuando la base esté en Turso,
 * los comprobantes estarán en R2 y esta rama no se usa.
 */
function carpetaDeDatos(): string {
  const url = process.env.DATABASE_URL ?? "";
  const archivo = url.replace(/^file:/, "").trim();

  if (archivo.startsWith("/") || /^[a-zA-Z]:/.test(archivo)) {
    return path.dirname(archivo);
  }
  return path.resolve(process.cwd(), "prisma", path.dirname(archivo || "."));
}

/* ──────────────────────────── R2 ──────────────────────────────── */

let cliente: AwsClient | null = null;

function r2(): AwsClient {
  cliente ??= new AwsClient({
    accessKeyId: ACCESS_KEY!,
    secretAccessKey: SECRET_KEY!,
    service: "s3",
    region: "auto",
  });
  return cliente;
}

function urlEnR2(clave: string): string {
  // Cada tramo por separado: una clave lleva barras y no deben escaparse.
  const ruta = clave.split("/").map(encodeURIComponent).join("/");
  return `https://${CUENTA}.r2.cloudflarestorage.com/${BUCKET}/${ruta}`;
}

/* ────────────────────── Lo que usa el resto ───────────────────── */

/**
 * Comprueba que la clave no se sale de su sitio.
 *
 * Parte del nombre lo pone quien sube el archivo, y un `..` bien puesto
 * en el disco deja escribir donde no se debe. En R2 no habría escape
 * posible, pero la comprobación va aquí y no en cada llamada: una regla
 * en un solo sitio es una regla que no se olvida en el próximo sitio.
 */
function comprobar(clave: string): void {
  if (
    !clave ||
    clave.includes("..") ||
    clave.startsWith("/") ||
    clave.includes("\\") ||
    /[\x00-\x1f]/.test(clave)
  ) {
    throw new Error(`Clave de archivo no válida: «${clave}»`);
  }
}

export async function guardar(
  clave: string,
  bytes: Uint8Array,
  tipo: string
): Promise<void> {
  comprobar(clave);

  if (usandoR2) {
    const r = await r2().fetch(urlEnR2(clave), {
      method: "PUT",
      /*
        Un ArrayBuffer, no la vista: el cuerpo tiene que llegar con un
        tamaño conocido para que se pueda anunciar en Content-Length.
      */
      body: bytes.slice().buffer,
      headers: {
        "Content-Type": tipo,
        /*
          R2 rechaza con 411 cualquier subida sin Content-Length: su API
          no acepta cuerpos troceados. Normalmente `fetch` la pone sola al
          recibir bytes de tamaño conocido, pero dentro de Next no llega:
          Next envuelve `fetch` para su caché, rehace la petición y por el
          camino el cuerpo pasa a ser un flujo sin tamaño.

          Por eso va escrita a mano. Y por eso el fallo no salió en las
          pruebas: un script suelto usa el `fetch` de Node, que sí la
          ponía. Solo aparecía dentro del servidor.
        */
        "Content-Length": String(bytes.byteLength),
      },
    });
    if (!r.ok) {
      throw new Error(`R2 no guardó «${clave}»: ${r.status} ${await r.text()}`);
    }
    return;
  }

  const destino = rutaEnDisco(clave);
  await mkdir(path.dirname(destino), { recursive: true });
  await writeFile(destino, bytes);
}

export async function leer(clave: string): Promise<Archivo | null> {
  try {
    comprobar(clave);
  } catch {
    return null;
  }

  if (usandoR2) {
    const r = await r2().fetch(urlEnR2(clave));
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`R2 no leyó «${clave}»: ${r.status}`);
    const bytes = new Uint8Array(await r.arrayBuffer());
    return {
      bytes,
      tipo: r.headers.get("content-type") ?? "application/octet-stream",
      tamano: bytes.byteLength,
    };
  }

  const destino = rutaEnDisco(clave);
  try {
    const info = await stat(destino);
    if (!info.isFile()) return null;
    const bytes = new Uint8Array(await readFile(destino));
    return { bytes, tipo: tipoPorExtension(destino), tamano: info.size };
  } catch {
    return null;
  }
}

export async function borrar(clave: string): Promise<void> {
  comprobar(clave);

  if (usandoR2) {
    const r = await r2().fetch(urlEnR2(clave), { method: "DELETE" });
    // 404 al borrar no es un fallo: el final deseado es que no esté.
    if (!r.ok && r.status !== 404) {
      throw new Error(`R2 no borró «${clave}»: ${r.status}`);
    }
    return;
  }

  await rm(rutaEnDisco(clave), { force: true });
}

const POR_EXTENSION: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".heic": "image/heic",
  ".pdf": "application/pdf",
};

export function tipoPorExtension(nombre: string): string {
  return POR_EXTENSION[path.extname(nombre).toLowerCase()] ?? "application/octet-stream";
}

/** Las extensiones que esta tienda sabe servir. */
export function extensionServible(nombre: string): boolean {
  return path.extname(nombre).toLowerCase() in POR_EXTENSION;
}
