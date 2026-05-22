"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const ALLOWED_KEYS = new Set([
  "brand_name",
  "sender_name",
  "sender_phone",
  "sender_address",
  "order_prefix",
]);

export async function saveSettingsAction(formData: FormData) {
  for (const [k, v] of formData.entries()) {
    if (!ALLOWED_KEYS.has(k) || typeof v !== "string") continue;
    await prisma.setting.upsert({
      where: { key: k },
      update: { value: v },
      create: { key: k, value: v },
    });
  }
  revalidatePath("/configuracion");
  return { ok: true as const };
}
