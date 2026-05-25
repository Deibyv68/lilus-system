import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

// ──────────────────────────────────────────────────────────
// Constantes
// ──────────────────────────────────────────────────────────
export const SESSION_COOKIE = "lilus_session";
export const DEVICE_COOKIE = "lilus_device";

const SESSION_DAYS = 7;
const DEVICE_DAYS = 90;

export const MAX_PIN_TRIES = 5;
export const PIN_LOCK_MINUTES = 5;

// ──────────────────────────────────────────────────────────
// Hashing
// ──────────────────────────────────────────────────────────
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(pin, hash);
  } catch {
    return false;
  }
}

// ──────────────────────────────────────────────────────────
// Tokens
// ──────────────────────────────────────────────────────────
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

// ──────────────────────────────────────────────────────────
// Sesiones
// ──────────────────────────────────────────────────────────
export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { userId, token, expiresAt },
  });
  return token;
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    // Sesión expirada — limpiar
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }
  if (!session.user.isActive) return null;
  return session.user;
}

export async function destroyAllSessionsForUser(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
}

// ──────────────────────────────────────────────────────────
// Dispositivos de confianza
// ──────────────────────────────────────────────────────────
export async function setDeviceCookie(token: string) {
  const store = await cookies();
  store.set(DEVICE_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: DEVICE_DAYS * 24 * 60 * 60,
  });
}

export async function clearDeviceCookie() {
  const store = await cookies();
  store.delete(DEVICE_COOKIE);
}

export async function getTrustedDevice() {
  const store = await cookies();
  const token = store.get(DEVICE_COOKIE)?.value;
  if (!token) return null;
  const device = await prisma.trustedDevice.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!device || !device.user.isActive) return null;
  return device;
}

export async function createTrustedDevice(
  userId: string,
  pin: string,
  name?: string
): Promise<string> {
  const token = generateToken();
  const pinHash = await hashPin(pin);
  await prisma.trustedDevice.create({
    data: { userId, token, pinHash, name },
  });
  return token;
}

// ──────────────────────────────────────────────────────────
// Validación
// ──────────────────────────────────────────────────────────
export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

export function isValidUsername(s: string): boolean {
  return /^[a-zA-Z0-9_.-]{3,40}$/.test(s);
}

// Bloqueo por intentos fallidos
export async function bumpFailedTries(deviceId: string) {
  const device = await prisma.trustedDevice.update({
    where: { id: deviceId },
    data: { failedTries: { increment: 1 } },
  });
  if (device.failedTries >= MAX_PIN_TRIES) {
    await prisma.trustedDevice.update({
      where: { id: deviceId },
      data: {
        lockedUntil: new Date(Date.now() + PIN_LOCK_MINUTES * 60 * 1000),
      },
    });
  }
  return device;
}

export async function resetFailedTries(deviceId: string) {
  await prisma.trustedDevice.update({
    where: { id: deviceId },
    data: { failedTries: 0, lockedUntil: null, lastSeenAt: new Date() },
  });
}
