"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  hashPassword,
  isValidUsername,
  destroyAllSessionsForUser,
} from "@/lib/auth";

async function requireAdmin() {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") {
    throw new Error("Solo administradores pueden hacer esto");
  }
  return me;
}

export async function createUserAction(formData: FormData) {
  await requireAdmin();
  const username = String(formData.get("username") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "user");

  if (!isValidUsername(username)) {
    return {
      ok: false as const,
      error:
        "Usuario inválido. Usa letras, números, punto, guion (3-40 chars).",
    };
  }
  if (!name) return { ok: false as const, error: "Nombre requerido" };
  if (password.length < 6) {
    return {
      ok: false as const,
      error: "La contraseña debe tener al menos 6 caracteres",
    };
  }
  if (role !== "admin" && role !== "user") {
    return { ok: false as const, error: "Rol inválido" };
  }

  try {
    await prisma.user.create({
      data: {
        username,
        name,
        passwordHash: await hashPassword(password),
        role,
      },
    });
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      return { ok: false as const, error: "Ese usuario ya existe" };
    }
    throw e;
  }

  revalidatePath("/configuracion/usuarios");
  return { ok: true as const };
}

export async function toggleUserActiveAction(userId: string) {
  const me = await requireAdmin();
  if (me.id === userId) {
    throw new Error("No puedes desactivar tu propio usuario");
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Usuario no encontrado");
  const newActive = !user.isActive;
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: newActive },
  });
  if (!newActive) {
    // Si lo desactivamos, cerrar sus sesiones
    await destroyAllSessionsForUser(userId);
  }
  revalidatePath("/configuracion/usuarios");
}

export async function resetPasswordAction(userId: string, newPassword: string) {
  await requireAdmin();
  if (newPassword.length < 6) {
    return {
      ok: false as const,
      error: "La contraseña debe tener al menos 6 caracteres",
    };
  }
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  // Cerrar todas sus sesiones para forzar nuevo login
  await destroyAllSessionsForUser(userId);
  revalidatePath("/configuracion/usuarios");
  return { ok: true as const };
}

export async function deleteUserAction(userId: string) {
  const me = await requireAdmin();
  if (me.id === userId) {
    throw new Error("No puedes eliminar tu propio usuario");
  }
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/configuracion/usuarios");
}
