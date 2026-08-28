import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/guard";

export const dynamic = "force-dynamic";

/**
 * ¿Ya terminó de leerse este comprobante?
 *
 * ── Para qué ──
 *
 * El OCR corre después de responder a la subida, y tarda entre cinco y
 * quince segundos en la laptop que hace de servidor. Sin esta ruta, la
 * única forma de ver la lectura era recargar la página a mano — y nadie
 * recarga una página que no le ha dicho que tiene algo nuevo.
 *
 * El panel pregunta aquí cada par de segundos mientras espera, y cuando
 * llega la lectura rellena el formulario solo.
 *
 * ── Por qué solo con sesión ──
 *
 * Lo que devuelve es lo que creyó leer una máquina en un documento
 * bancario. No sale de aquí: la página del cliente no lo pide ni lo
 * enseña, a propósito. Decirle «recibimos $25,50» porque un OCR lo creyó
 * ver, y descubrir mañana que el dinero no entró, no lo arregla ninguna
 * disculpa.
 *
 * A quien no tiene sesión se le responde 404 y no 403, por lo mismo que
 * en la ruta de al lado: un 403 confirmaría que ese comprobante existe.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const usuario = await currentUser();
  if (!usuario) return new NextResponse(null, { status: 404 });

  const { id } = await params;

  const c = await prisma.comprobanteDePago.findUnique({
    where: { id },
    select: {
      leidoEn: true,
      montoLeido: true,
      numeroLeido: true,
      fechaLeida: true,
      bancoLeido: true,
    },
  });

  if (!c) return new NextResponse(null, { status: 404 });

  return NextResponse.json(
    {
      leido: c.leidoEn !== null,
      monto: c.montoLeido,
      numero: c.numeroLeido,
      fecha: c.fechaLeida,
      banco: c.bancoLeido,
    },
    { headers: { "cache-control": "no-store" } }
  );
}
