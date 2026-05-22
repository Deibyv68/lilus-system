import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await prisma.setting.findMany();
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  return (
    <>
      <PageHeader
        title="Configuración"
        description="Datos del remitente que aparecen en la etiqueta de envío."
      />
      <Card>
        <CardHeader>
          <CardTitle>Remitente</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm
            initial={{
              brand_name: map.brand_name ?? "LILUS",
              sender_name: map.sender_name ?? "LILUS Jabones Artesanales",
              sender_phone: map.sender_phone ?? "",
              sender_address: map.sender_address ?? "Quito, Ecuador",
              order_prefix: map.order_prefix ?? "LILUS",
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
