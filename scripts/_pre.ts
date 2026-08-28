import sharp from "sharp";
import { createWorker } from "tesseract.js";
import path from "node:path";

const origen = process.argv[2];
const cache = path.join(process.cwd(), ".tesseract");

async function leer(buf: Buffer, etiqueta: string) {
  const w = await createWorker(["spa", "eng"], undefined, { cachePath: cache, logger: () => {} });
  const { data } = await w.recognize(buf);
  await w.terminate();
  const t = (data.text ?? "").trim();
  console.log(`\n═══ ${etiqueta} ═══`);
  console.log(t.split("\n").filter(Boolean).slice(0, 14).join("\n"));
  return t;
}

(async () => {
  const base = sharp(origen);
  const meta = await base.metadata();
  console.log("imagen:", meta.width, "x", meta.height);

  // A: tal cual (lo de hoy)
  await leer(await sharp(origen).toBuffer(), "A · tal cual");

  // B: invertida entera
  await leer(await sharp(origen).grayscale().negate().toBuffer(), "B · invertida");

  // C: gris + normalizada (estira el contraste)
  await leer(await sharp(origen).grayscale().normalize().toBuffer(), "C · gris normalizada");

  // D: invertida + normalizada
  await leer(await sharp(origen).grayscale().negate().normalize().toBuffer(), "D · invertida normalizada");
})();
