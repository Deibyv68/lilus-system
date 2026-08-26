import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "./settings-form";
import { PrintAgentSettings } from "./print-agent-settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await prisma.setting.findMany();
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  return (
    <>
      <PageHeader
        title="Configuración"
        description="Datos del remitente y agente de impresión."
      />
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Marca y remitente</CardTitle>
          </CardHeader>
          <CardContent>
            <SettingsForm
              initial={{
                brand_name: map.brand_name ?? "LILUS",
                order_prefix: map.order_prefix ?? "LILUS",
                sender_name: map.sender_name ?? "LILUS Jabones Artesanales",
                sender_cedula: map.sender_cedula ?? "",
                sender_phone: map.sender_phone ?? "",
                sender_email: map.sender_email ?? "",
                sender_city: map.sender_city ?? "Quito",
                sender_province: map.sender_province ?? "Pichincha",
                sender_address: map.sender_address ?? "",
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agente de impresión</CardTitle>
          </CardHeader>
          <CardContent>
            <PrintAgentSettings
              initial={{
                enabled: map.print_agent_enabled === "true",
                token: map.print_agent_token ?? "",
                printer: map.print_agent_printer ?? "",
              }}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
