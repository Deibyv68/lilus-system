import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { UsersAdmin } from "./users-admin";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: { select: { trustedDevices: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Personas que pueden acceder al sistema. Solo los administradores ven esta pantalla."
      />
      <UsersAdmin
        users={users.map((u) => ({
          id: u.id,
          username: u.username,
          name: u.name,
          role: u.role,
          isActive: u.isActive,
          createdAt: u.createdAt.toISOString(),
          deviceCount: u._count.trustedDevices,
        }))}
        currentUserId={me.id}
      />
    </>
  );
}
