import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAgentToken } from "@/lib/print-queue";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get("token");
  if (!(await validateAgentToken(token))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { success?: boolean; error?: string } = {};
  try {
    body = await req.json();
  } catch {}

  await prisma.printJob.update({
    where: { id },
    data: {
      status: body.success === false ? "FAILED" : "DONE",
      error: body.error?.slice(0, 500) ?? null,
      finishedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
