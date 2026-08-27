import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { json, usuarioDePeticion } from "@/lib/auth-movil";

export const dynamic = "force-dynamic";

/**
 * Entrar desde la app.
 *
 * Devuelve el token de sesión para que la app lo guarde. Es el mismo
 * token que el navegador lleva en su cookie: ver `auth-movil.ts` para el
 * porqué.
 *
 * ── Sobre el mensaje de error ──
 *
 * «Usuario o contraseña incorrectos» para los tres casos —no existe,
 * está desactivado, la clave está mal— igual que en el login web. Decir
 * cuál de los tres fue es decirle a quien prueba usuarios cuáles
 * existen.
 */
export async function POST(req: NextRequest) {
  let cuerpo: { usuario?: unknown; clave?: unknown };
  try {
    cuerpo = await req.json();
  } catch {
    return json({ error: "Cuerpo inválido" }, 400);
  }

  const usuario = String(cuerpo.usuario ?? "").trim();
  const clave = String(cuerpo.clave ?? "");

  if (!usuario || !clave) {
    return json({ error: "Usuario y contraseña requeridos" }, 400);
  }

  const fila = await prisma.user.findUnique({ where: { username: usuario } });
  const malo = { error: "Usuario o contraseña incorrectos" };

  /*
    Se verifica la contraseña aunque el usuario no exista.

    bcrypt tarda unos 100 ms a propósito. Si saliéramos antes cuando el
    usuario no existe, la diferencia de tiempo entre una respuesta y otra
    diría si ese nombre está registrado. Comparar contra un hash de
    mentira cuesta lo mismo y no dice nada.
  */
  const hash = fila?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
  const correcta = await verifyPassword(clave, hash);

  if (!fila || !fila.isActive || !correcta) return json(malo, 401);

  const token = await createSession(fila.id);

  return json({
    token,
    usuario: {
      id: fila.id,
      username: fila.username,
      name: fila.name,
      role: fila.role,
    },
  });
}

/** Quién soy. La app lo usa al abrir para saber si su token sigue vivo. */
export async function GET(req: NextRequest) {
  const usuario = await usuarioDePeticion(req);
  if (!usuario) return json({ error: "No autorizado" }, 401);
  return json({ usuario });
}

/**
 * Salir.
 *
 * Borra la fila de sesión, no solo el token del teléfono. Si solo se
 * borrara en el aparato, la sesión seguiría viva en la base y valdría
 * para siempre a quien la hubiera copiado.
 */
export async function DELETE(req: NextRequest) {
  const cabecera = req.headers.get("authorization") ?? "";
  const token = cabecera.toLowerCase().startsWith("bearer ")
    ? cabecera.slice(7).trim()
    : null;

  if (token) await prisma.session.deleteMany({ where: { token } });

  // Siempre 200: que el token ya no existiera no es un problema de quien
  // pide salir, y decirlo solo sirve para averiguar si un token es válido.
  return json({ ok: true });
}
