import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { conSesion, json } from "@/lib/auth-movil";

export const dynamic = "force-dynamic";

/**
 * La app dice «este es mi token de Firebase, mándame los avisos aquí».
 *
 * Se llama en cada arranque, no solo la primera vez. Firebase rota el
 * token por su cuenta —al reinstalar, al restaurar el teléfono desde una
 * copia de seguridad, o cuando le parece— y un token viejo deja de
 * entregar sin avisar a nadie. Registrar en cada arranque es la forma
 * barata de que eso se corrija solo.
 */
export const POST = conSesion(async (req: NextRequest, usuario) => {
  let cuerpo: { token?: unknown; modelo?: unknown; version?: unknown };
  try {
    cuerpo = await req.json();
  } catch {
    return json({ error: "Cuerpo inválido" }, 400);
  }

  const token = String(cuerpo.token ?? "").trim();
  if (!token || token.length > 500) {
    return json({ error: "Token inválido" }, 400);
  }

  await prisma.dispositivoMovil.upsert({
    where: { token },
    create: {
      userId: usuario.id,
      token,
      modelo: String(cuerpo.modelo ?? "").slice(0, 60) || null,
      version: String(cuerpo.version ?? "").slice(0, 20) || null,
    },
    update: {
      /*
        Se actualiza el `userId`: el mismo teléfono puede cambiar de
        dueño de sesión —tu mamá y tú compartiendo un aparato— y los
        avisos deben seguir a quien esté dentro ahora.
      */
      userId: usuario.id,
      modelo: String(cuerpo.modelo ?? "").slice(0, 60) || null,
      version: String(cuerpo.version ?? "").slice(0, 20) || null,
      lastSeenAt: new Date(),
    },
  });

  return json({ ok: true });
});

/** Al cerrar sesión en la app, este aparato deja de recibir avisos. */
export const DELETE = conSesion(async (req: NextRequest) => {
  let cuerpo: { token?: unknown };
  try {
    cuerpo = await req.json();
  } catch {
    return json({ error: "Cuerpo inválido" }, 400);
  }

  const token = String(cuerpo.token ?? "").trim();
  if (token) {
    await prisma.dispositivoMovil.deleteMany({ where: { token } });
  }
  return json({ ok: true });
});
