import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Phone, MessageCircle, Mail, IdCard, ShoppingBag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Personas que han realizado pedidos."
      />

      {customers.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Los clientes se crean automáticamente al registrar pedidos.
          </p>
        </div>
      ) : (
        <>
          {/* ─── Móvil: tarjetas ─── */}
          <div className="space-y-3 md:hidden">
            {customers.map((c) => (
              <div key={c.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold leading-tight min-w-0 flex-1">
                    {c.name}
                  </p>
                  <Badge variant="secondary" className="shrink-0 gap-1">
                    <ShoppingBag className="size-3" />
                    {c._count.orders}
                  </Badge>
                </div>

                <div className="mt-3 space-y-1.5 text-sm">
                  {c.phone && (
                    <DataRow icon={Phone} label="Envío">
                      <a
                        href={`tel:${c.phone}`}
                        className="text-primary tabular-nums"
                      >
                        {c.phone}
                      </a>
                    </DataRow>
                  )}
                  {c.contactPhone && c.contactPhone !== c.phone && (
                    <DataRow icon={MessageCircle} label="WhatsApp">
                      <a
                        href={`https://wa.me/593${c.contactPhone.replace(/^0/, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary tabular-nums"
                      >
                        {c.contactPhone}
                      </a>
                    </DataRow>
                  )}
                  {c.cedula && (
                    <DataRow icon={IdCard} label="CI/RUC">
                      <span className="tabular-nums">{c.cedula}</span>
                    </DataRow>
                  )}
                  {c.email && (
                    <DataRow icon={Mail} label="Email">
                      <a
                        href={`mailto:${c.email}`}
                        className="text-primary break-all"
                      >
                        {c.email}
                      </a>
                    </DataRow>
                  )}
                  {!c.phone && !c.contactPhone && !c.cedula && !c.email && (
                    <p className="text-xs text-muted-foreground italic">
                      Sin datos de contacto
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ─── Escritorio: tabla ─── */}
          <div className="hidden md:block rounded-lg border bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>CI/RUC</TableHead>
                  <TableHead>Tel. envío</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Pedidos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-xs">{c.cedula ?? "—"}</TableCell>
                    <TableCell className="text-xs">{c.phone ?? "—"}</TableCell>
                    <TableCell className="text-xs">
                      {c.contactPhone ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs">{c.email ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {c._count.orders}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </>
  );
}

function DataRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground w-16 shrink-0">
        {label}
      </span>
      <span className="min-w-0 flex-1 text-sm">{children}</span>
    </div>
  );
}
