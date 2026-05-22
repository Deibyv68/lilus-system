import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShippingMatrix } from "./shipping-matrix";
import { ZoneCarrierForms } from "./zone-carrier-forms";

export const dynamic = "force-dynamic";

export default async function ShippingPage() {
  const [zones, carriers, rates] = await Promise.all([
    prisma.shippingZone.findMany({ orderBy: { name: "asc" } }),
    prisma.carrier.findMany({ orderBy: { name: "asc" } }),
    prisma.shippingRate.findMany(),
  ]);

  return (
    <>
      <PageHeader
        title="Envíos"
        description="Zonas, transportadoras y tarifas. Edita las celdas para fijar el precio por combinación."
      />

      <div className="space-y-6">
        <ZoneCarrierForms zones={zones} carriers={carriers} />

        <Card>
          <CardHeader>
            <CardTitle>Tarifas (USD)</CardTitle>
          </CardHeader>
          <CardContent>
            {zones.length === 0 || carriers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Necesitas al menos una zona y una transportadora para definir
                tarifas.
              </p>
            ) : (
              <ShippingMatrix zones={zones} carriers={carriers} rates={rates} />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
