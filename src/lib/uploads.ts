import path from "node:path";
import { randomUUID } from "node:crypto";
import { guardar } from "./almacen";

/*
  La raíz en disco, para la ruta que sirve estos archivos.

  Sigue existiendo porque cuando el almacén es el disco esa ruta lee
  directamente de ahí. Con R2 no se usa: el almacén resuelve la clave.
*/
export const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

const ALLOWED_IMAGE = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const ALLOWED_PDF = new Set(["application/pdf"]);
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export type UploadKind = "image" | "pdf";

export async function saveUpload(
  file: File,
  subdir: string,
  kind: UploadKind
): Promise<string> {
  if (file.size === 0) throw new Error("Archivo vacío");
  if (file.size > MAX_BYTES) throw new Error("Archivo supera 8 MB");

  const allowed = kind === "image" ? ALLOWED_IMAGE : ALLOWED_PDF;
  if (!allowed.has(file.type)) {
    throw new Error(
      kind === "image"
        ? "Formato de imagen no permitido (jpg, png, webp, gif)"
        : "Solo se permite PDF"
    );
  }

  const ext = kind === "image" ? mimeToExt(file.type) : "pdf";
  const filename = `${randomUUID()}.${ext}`;

  /*
    La clave lleva dentro la dirección pública: `uploads/productos/x.jpg`
    se sirve en `/uploads/productos/x.jpg`. Es a propósito — así lo que ya
    está guardado en la base sigue valiendo cuando los archivos se muden a
    R2, sin reescribir una sola fila.
  */
  const clave = `uploads/${subdir}/${filename}`;
  await guardar(clave, new Uint8Array(await file.arrayBuffer()), file.type);
  return `/${clave}`;
}

function mimeToExt(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "bin";
  }
}
