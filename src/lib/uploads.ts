import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

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

  const ext =
    kind === "image" ? mimeToExt(file.type) : "pdf";
  const filename = `${randomUUID()}.${ext}`;
  const dir = path.join(UPLOAD_ROOT, subdir);
  await mkdir(dir, { recursive: true });
  const filepath = path.join(dir, filename);
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buf);
  return `/uploads/${subdir}/${filename}`;
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
