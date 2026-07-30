import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { materialCategoryMeta } from "@/lib/inventario";
import { formatCurrency } from "@/lib/format";
import { LotsPanel } from "./lots-panel";
import {
  ArrowLeft,
  Pencil,
  Percent,
  Beaker,
  Thermometer,
  Droplet,
  ShieldAlert,
  Package,
  Snowflake,
  Sun,
  Wind,
  CloudDrizzle,
  FileText,
  Info,
  AlertTriangle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const material = await prisma.material.findUnique({
    where: { slug },
    include: { lots: { orderBy: { createdAt: "desc" } } },
  });
  if (!material) notFound();

  const meta = materialCategoryMeta(material.category);
  const Icon = meta.icon;

  const pendingPurchase = (material.notes ?? "").includes("PENDIENTE COMPRAR");
  const hasTechData = material.usageMax != null || material.phMax != null;

  // Precio por gramo del último lote con datos, para tener referencia
  const lotWithPrice = material.lots.find(
    (l) => l.price != null && l.quantity != null && l.quantity > 0
  );
  const unitPrice =
    lotWithPrice && lotWithPrice.price != null && lotWithPrice.quantity
      ? lotWithPrice.price / lotWithPrice.quantity
      : null;

  const specs = [
    material.usageMin != null || material.usageMax != null
      ? {
          icon: Percent,
          label: "Uso",
          value:
            material.usageMin != null && material.usageMax != null
              ? `${material.usageMin} – ${material.usageMax} %`
              : `${material.usageMin ?? material.usageMax} %`,
        }
      : null,
    material.phMin != null || material.phMax != null
      ? {
          icon: Beaker,
          label: "pH",
          value:
            material.phMin != null && material.phMax != null
              ? `${material.phMin} – ${material.phMax}`
              : `${material.phMin ?? material.phMax}`,
        }
      : null,
    material.maxTemp != null
      ? { icon: Thermometer, label: "Temp. máx.", value: `${material.maxTemp} °C` }
      : null,
    material.solubility
      ? { icon: Droplet, label: "Soluble en", value: material.solubility }
      : null,
  ].filter(Boolean) as { icon: typeof Percent; label: string; value: string }[];

  const cares = [
    material.storage === "refrigerado"
      ? { icon: Snowflake, text: "Guardar refrigerado" }
      : null,
    material.lightSensitive ? { icon: Sun, text: "Sensible a la luz" } : null,
    material.oxygenSensitive ? { icon: Wind, text: "Sensible al oxígeno" } : null,
    material.moistureSensitive
      ? { icon: CloudDrizzle, text: "Sensible a la humedad" }
      : null,
  ].filter(Boolean) as { icon: typeof Sun; text: string }[];

  return (
    <>
      <div className="mb-4">
        <Link
          href="/inventario"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Inventario
        </Link>
      </div>

      {/* Encabezado */}
      <div className="flex items-start gap-4 mb-5">
        <div
          className={`size-16 rounded-xl flex items-center justify-center shrink-0 ${meta.chip}`}
        >
          <Icon className="size-7" />
        </div>
        <div className="min-w-0 flex-1">
          <span
            className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${meta.chip}`}
          >
            {meta.label}
          </span>
          <h1 className="text-xl font-bold leading-tight mt-1.5">
            {material.name}
          </h1>
          {material.inciName && (
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              {material.inciName}
            </p>
          )}
          {(material.tradeName || material.manufacturer) && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {material.tradeName}
              {material.tradeName && material.manufacturer && " · "}
              {material.manufacturer}
            </p>
          )}
        </div>
        <Button asChild variant="outline" size="icon" className="size-10 shrink-0">
          <Link href={`/inventario/${material.slug}/editar`} aria-label="Editar">
            <Pencil className="size-4" />
          </Link>
        </Button>
      </div>

      {material.purpose && (
        <p className="text-sm leading-relaxed mb-5">{material.purpose}</p>
      )}

      {/* Avisos */}
      {pendingPurchase && (
        <div className="rounded-xl border border-sky-300 bg-sky-50 dark:bg-sky-950/25 dark:border-sky-900 p-3 mb-4 flex gap-2.5">
          <Info className="size-4 shrink-0 mt-0.5 text-sky-600 dark:text-sky-400" />
          <p className="text-sm">
            Todavía no se tiene. Está en la lista de lo que conviene comprar.
          </p>
        </div>
      )}

      {!hasTechData && !pendingPurchase && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/25 dark:border-amber-900 p-3 mb-4 flex gap-2.5">
          <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="text-sm">
            <p className="font-medium">Sin ficha técnica</p>
            <p className="text-muted-foreground text-xs mt-0.5 leading-snug">
              Falta el porcentaje de uso y el rango de pH. Pídeselos al
              proveedor: son datos del fabricante y te los tiene que dar.
            </p>
          </div>
        </div>
      )}

      {/* Ficha técnica */}
      {specs.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {specs.map((s) => {
            const SIcon = s.icon;
            return (
              <div key={s.label} className="rounded-xl border bg-card p-3">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <SIcon className="size-3.5" />
                  <span className="text-[10px] uppercase tracking-wider font-medium">
                    {s.label}
                  </span>
                </div>
                <p className="text-sm font-semibold leading-tight">{s.value}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-5">
        {/* Incompatibilidades */}
        {material.incompatible && (
          <section>
            <h2 className="text-sm font-semibold mb-2">No se lleva con</h2>
            <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/25 dark:border-red-900 p-3 flex gap-2.5">
              <ShieldAlert className="size-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <p className="text-sm leading-relaxed">{material.incompatible}</p>
            </div>
          </section>
        )}

        {/* Conservación */}
        {(cares.length > 0 || material.container || material.openedShelfLife) && (
          <section>
            <h2 className="text-sm font-semibold mb-2">Conservación</h2>
            <div className="rounded-xl border bg-card p-3 space-y-2">
              {material.container && (
                <div className="flex items-start gap-2 text-sm">
                  <Package className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <span>{material.container}</span>
                </div>
              )}
              {cares.map((c) => {
                const CIcon = c.icon;
                return (
                  <div key={c.text} className="flex items-start gap-2 text-sm">
                    <CIcon className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <span>{c.text}</span>
                  </div>
                );
              })}
              {material.openedShelfLife && (
                <div className="flex items-start gap-2 text-sm">
                  <FileText className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <span>Una vez abierto: {material.openedShelfLife}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Espectro, para conservantes */}
        {material.spectrum && (
          <section>
            <h2 className="text-sm font-semibold mb-2">Protege contra</h2>
            <div className="rounded-xl border bg-card p-3">
              <p className="text-sm">{material.spectrum}</p>
            </div>
          </section>
        )}

        {/* Notas */}
        {material.notes && (
          <section>
            <h2 className="text-sm font-semibold mb-2">Notas</h2>
            <div className="rounded-xl border bg-card p-3">
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {material.notes}
              </p>
            </div>
          </section>
        )}

        {/* Referencia de precio */}
        {unitPrice != null && lotWithPrice && (
          <section>
            <h2 className="text-sm font-semibold mb-2">Precio de referencia</h2>
            <div className="rounded-xl border bg-card p-3">
              <p className="text-sm">
                <strong className="tabular-nums">
                  {formatCurrency(unitPrice)}
                </strong>{" "}
                por {lotWithPrice.unit ?? "unidad"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Del último lote con precio registrado.
              </p>
            </div>
          </section>
        )}

        {/* Lotes */}
        <LotsPanel
          materialId={material.id}
          lots={material.lots.map((l) => ({
            id: l.id,
            supplier: l.supplier,
            purchasedAt: l.purchasedAt?.toISOString() ?? null,
            openedAt: l.openedAt?.toISOString() ?? null,
            expiresAt: l.expiresAt?.toISOString() ?? null,
            lotCode: l.lotCode,
            quantity: l.quantity,
            unit: l.unit,
            price: l.price,
            container: l.container,
            status: l.status,
            notes: l.notes,
          }))}
        />
      </div>
    </>
  );
}
