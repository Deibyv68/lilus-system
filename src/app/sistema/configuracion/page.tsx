import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
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
                bank_details: map.bank_details ?? "",
                deuna_enlace: map.deuna_enlace ?? "",
                contact_whatsapp: map.contact_whatsapp ?? "",
                contact_instagram: map.contact_instagram ?? "",
                contact_tiktok: map.contact_tiktok ?? "",
                promo_activa: map.promo_activa ?? "false",
                promo_texto: map.promo_texto ?? "",
                promo_enlace: map.promo_enlace ?? "",
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

        <Card>
          <CardHeader>
            <CardTitle>Avisos de venta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Que suene el teléfono cuando alguien compre por la web, aunque
              el panel esté cerrado.
            </p>
            <Button asChild variant="outline" className="mt-3">
              <Link href="/sistema/configuracion/avisos">
                <Bell className="size-4" /> Configurar los avisos
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
