"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  verifyPin,
  createSession,
  setSessionCookie,
  clearSessionCookie,
  setDeviceCookie,
  clearDeviceCookie,
  createTrustedDevice,
  getTrustedDevice,
  isValidPin,
  bumpFailedTries,
  resetFailedTries,
  PIN_LOCK_MINUTES,
} from "@/lib/auth";

export async function loginWithPassword(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const trustDevice = formData.get("trustDevice") === "on";
  const pin = String(formData.get("pin") ?? "").trim();

  if (!username || !password) {
    return { ok: false as const, error: "Usuario y contraseña requeridos" };
  }

  if (trustDevice && !isValidPin(pin)) {
    return {
      ok: false as const,
      error: "El PIN debe ser de 4 dígitos numéricos",
    };
  }

  const user = await prisma.user.findUnique({
    where: { username },
  });
  if (!user || !user.isActive) {
    return { ok: false as const, error: "Usuario o contraseña incorrectos" };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { ok: false as const, error: "Usuario o contraseña incorrectos" };
  }

  // Sesión normal
  const sessionToken = await createSession(user.id);
  await setSessionCookie(sessionToken);

  // Si pidió confiar en el dispositivo, crear TrustedDevice + cookie
  if (trustDevice) {
    const deviceToken = await createTrustedDevice(user.id, pin);
    await setDeviceCookie(deviceToken);
  }

  redirect("/");
}

export async function loginWithPin(formData: FormData) {
  const pin = String(formData.get("pin") ?? "").trim();
  if (!isValidPin(pin)) {
    return { ok: false as const, error: "Ingresa 4 dígitos" };
  }

  const device = await getTrustedDevice();
  if (!device) {
    return {
      ok: false as const,
      error: "Este dispositivo no es de confianza. Inicia sesión con contraseña.",
    };
  }

  // ¿Bloqueado por intentos fallidos?
  if (device.lockedUntil && device.lockedUntil > new Date()) {
    const minutes = Math.ceil(
      (device.lockedUntil.getTime() - Date.now()) / 60000
    );
    return {
      ok: false as const,
      error: `Demasiados intentos. Espera ${minutes} min o usa contraseña.`,
    };
  }

  const valid = await verifyPin(pin, device.pinHash);
  if (!valid) {
    const updated = await bumpFailedTries(device.id);
    const remaining = Math.max(0, 5 - updated.failedTries);
    if (updated.failedTries >= 5) {
      return {
        ok: false as const,
        error: `PIN bloqueado por ${PIN_LOCK_MINUTES} min. Usa contraseña.`,
      };
    }
    return {
      ok: false as const,
      error: `PIN incorrecto · ${remaining} intento${remaining === 1 ? "" : "s"} restante${remaining === 1 ? "" : "s"}`,
    };
  }

  // Éxito — limpiar contador, crear sesión
  await resetFailedTries(device.id);
  const sessionToken = await createSession(device.userId);
  await setSessionCookie(sessionToken);
  redirect("/");
}

export async function logoutAction() {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const sessionToken = store.get("lilus_session")?.value;
  if (sessionToken) {
    await prisma.session.deleteMany({ where: { token: sessionToken } });
  }
  await clearSessionCookie();
  // NO borramos la cookie de dispositivo — sigue de confianza para PIN
  redirect("/login");
}

export async function forgetDeviceAction() {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const deviceToken = store.get("lilus_device")?.value;
  if (deviceToken) {
    await prisma.trustedDevice.deleteMany({ where: { token: deviceToken } });
  }
  await clearDeviceCookie();
  await clearSessionCookie();
  revalidatePath("/login");
  redirect("/login");
}
