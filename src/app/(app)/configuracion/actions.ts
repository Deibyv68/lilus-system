"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

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
  "print_agent_enabled",
  "print_agent_token",
  "print_agent_printer",
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

export async function savePrintAgentSettingsAction(args: {
  enabled: boolean;
  token: string;
  printer: string;
}) {
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
  revalidatePath("/configuracion");
  return { ok: true as const };
}
