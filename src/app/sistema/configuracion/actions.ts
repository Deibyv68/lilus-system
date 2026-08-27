"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";
import { saveUpload } from "@/lib/uploads";
import { revalidarTienda } from "@/lib/revalidar-tienda";

const ALLOWED_KEYS = new Set([
  "brand_name",
  "sender_name",
  "sender_cedula",
  "sender_phone",
  "sender_email",
  "sender_city",
  "sender_province",
  "sender_address",
  "order_prefix",
  "bank_details",
  /*
    Los datos de la cuenta, uno por uno.

    Antes eran un solo texto libre. Se separan porque la página del pedido
    pone un botón de copiar junto a cada dato: quien va a transferir tiene
    que pegar el número de cuenta en un campo y el nombre en otro, y
    copiar el bloque entero le obliga a borrar lo que sobra en cada uno.
    Un texto suelto no se puede partir de forma fiable.
  */
  "pago_banco",
  "pago_tipo_cuenta",
  "pago_numero_cuenta",
  "pago_titular",
  "pago_cedula",
  "pago_correo",
  "deuna_enlace",
  "contact_whatsapp",
  "contact_instagram",
  "contact_tiktok",
  "promo_activa",
  "promo_texto",
  "promo_enlace",
  "print_agent_enabled",
  "print_agent_token",
  "print_agent_printer",
]);

export async function saveSettingsAction(formData: FormData) {
  await requireAdmin();

  for (const [k, v] of formData.entries()) {
    if (!ALLOWED_KEYS.has(k) || typeof v !== "string") continue;
    await prisma.setting.upsert({
      where: { key: k },
      update: { value: v },
      create: { key: k, value: v },
    });
  }
  revalidatePath("/sistema/configuracion");
  return { ok: true as const };
}

export async function savePrintAgentSettingsAction(args: {
  enabled: boolean;
  token: string;
  printer: string;
}) {
  await requireAdmin();

  await prisma.setting.upsert({
    where: { key: "print_agent_enabled" },
    update: { value: args.enabled ? "true" : "false" },
    create: { key: "print_agent_enabled", value: args.enabled ? "true" : "false" },
  });
  await prisma.setting.upsert({
    where: { key: "print_agent_token" },
    update: { value: args.token.trim() },
    create: { key: "print_agent_token", value: args.token.trim() },
  });
  await prisma.setting.upsert({
    where: { key: "print_agent_printer" },
    update: { value: args.printer.trim() },
    create: { key: "print_agent_printer", value: args.printer.trim() },
  });
  revalidatePath("/sistema/configuracion");
  return { ok: true as const };
}

/**
 * La foto del QR de DeUna, tal como la da la app.
 *
 * ── Por qué se sube una imagen y no basta el enlace ──
 *
 * De un enlace sabemos hacer un QR —lo hace `src/lib/qr.ts`— y para un
 * link de cobro eso alcanza. Pero el QR que DeUna enseña en la app no
 * siempre es la misma cadena que el enlace para compartir: puede llevar
 * dentro el formato propio de la red de pagos. Regenerarlo desde el
 * enlace daría un código que escanea distinto, o que no escanea.
 *
 * Subiendo la captura tal cual, lo que ve el cliente es exactamente el
 * código que el banco emitió. Si no hay imagen, se sigue generando desde
 * el enlace, que era el comportamiento anterior.
 */
export async function subirQrDeunaAction(formData: FormData) {
  await requireAdmin();

  const archivo = formData.get("qr");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { ok: false as const, error: "Elige una imagen" };
  }

  let url: string;
  try {
    url = await saveUpload(archivo, "cobro", "image");
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }

  await prisma.setting.upsert({
    where: { key: "deuna_qr" },
    update: { value: url },
    create: { key: "deuna_qr", value: url },
  });

  revalidatePath("/sistema/configuracion");
  revalidarTienda();
  return { ok: true as const, url };
}

/** Quita la imagen y vuelve al QR generado desde el enlace. */
export async function quitarQrDeunaAction() {
  await requireAdmin();

  /*
   * Se borra el ajuste, no el archivo del disco. Igual que en el feed:
   * el respaldo de `deploy/backup-db.sh` guarda `public/uploads` sin
   * borrar nada, y una imagen suelta no le hace daño a nadie.
   */
  await prisma.setting.deleteMany({ where: { key: "deuna_qr" } });

  revalidatePath("/sistema/configuracion");
  revalidarTienda();
  return { ok: true as const };
}
