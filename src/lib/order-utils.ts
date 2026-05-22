import { prisma } from "./prisma";
import { addMonths } from "date-fns";

export async function generateOrderNumber(): Promise<string> {
  const setting = await prisma.setting.findUnique({
    where: { key: "order_prefix" },
  });
  const prefix = setting?.value ?? "LILUS";
  const count = await prisma.order.count();
  const next = count + 1;
  return `${prefix}-${String(next).padStart(6, "0")}`;
}

export function generateBatchCode(date: Date = new Date(), sequence: number): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `L${y}${m}${d}-${String(sequence).padStart(3, "0")}`;
}

export function calcExpiry(manufactureDate: Date, shelfLifeMonths: number): Date {
  return addMonths(manufactureDate, shelfLifeMonths);
}
