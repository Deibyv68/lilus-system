import { toBuffer } from "bwip-js/node";

export async function generateBarcodePng(
  value: string,
  opts?: { scale?: number; height?: number; includetext?: boolean }
): Promise<Buffer> {
  return toBuffer({
    bcid: "code128",
    text: value,
    scale: opts?.scale ?? 3,
    height: opts?.height ?? 10, // mm
    includetext: opts?.includetext ?? false,
    textxalign: "center",
    paddingwidth: 0,
    paddingheight: 0,
    backgroundcolor: "FFFFFF",
  });
}
