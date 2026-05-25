import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * Resetea la contraseña del usuario admin a "lilus2026".
 * Si no existe ningún usuario admin, lo crea.
 *
 * Uso:
 *   npx tsx scripts/reset-admin-password.ts
 *   npx tsx scripts/reset-admin-password.ts "MiNuevaClave"
 */
const prisma = new PrismaClient();

async function main() {
  const newPassword = process.argv[2] ?? "lilus2026";
  const passwordHash = await bcrypt.hash(newPassword, 10);

  const existing = await prisma.user.findUnique({ where: { username: "admin" } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, isActive: true },
    });
    // Limpiar sesiones y dispositivos de confianza para forzar re-login
    await prisma.session.deleteMany({ where: { userId: existing.id } });
    await prisma.trustedDevice.deleteMany({ where: { userId: existing.id } });
    console.log(`✔ Contraseña del admin reseteada a: ${newPassword}`);
    console.log("  (Sesiones y dispositivos de confianza eliminados)");
  } else {
    await prisma.user.create({
      data: {
        username: "admin",
        name: "Administrador LILUS",
        passwordHash,
        role: "admin",
      },
    });
    console.log(`✔ Usuario admin creado con contraseña: ${newPassword}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
