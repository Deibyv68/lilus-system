import { PageHeader } from "@/components/page-header";
import { costearProductos, costearPacks } from "@/lib/costeo";
import { formatCurrency } from "@/lib/format";
import { AlertTriangle, TriangleAlert } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Cuánto cuesta producir cada cosa, y cuánto queda.
 *
 * Se calcula al abrir la página en vez de leer `productionCost`: el número
 * guardado sirve para los pedidos ya hechos —lo que costó entonces— y este
 * para decidir precios hoy. Si sube la base, aquí se ve al instante.
 */
export default async function CostosPage() {
  const productos = await costearProductos();
  const packs = await costearPacks(productos);

  const completos = productos.filter((p) => p.total != null);
  const pendientes = productos.filter((p) => p.total == null);
  const packsCompletos = packs.filter((p) => p.total != null);

  return (
    <>
      <PageHeader
        title="Costos"
        description="Lo que cuesta producir cada producto, calculado desde las recetas y los precios de compra."
      />

      <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/25 dark:border-amber-900 p-4 mb-6 flex gap-3">
        <TriangleAlert className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-sm leading-relaxed">
          <p className="font-semibold mb-1">Estos números no incluyen el trabajo</p>
          <p>
            Son materia prima y empaque. El tiempo de elaborar, envolver y
            despachar es el costo más grande de un producto artesanal y no
            aparece acá — tenelo presente al mirar el margen.
          </p>
        </div>
      </div>

      {/* ── Productos costeados ── */}
      <section className="mb-8">
        <h2 className="text-sm tablet:text-lg font-semibold mb-2">
          Productos con costo{" "}
          <span className="text-muted-foreground font-normal">
            ({completos.length})
          </span>
        </h2>
        <Tabla
          filas={completos.map((c) => ({
            nombre: c.nombre,
            a: c.materiaPrima,
            b: c.empaque,
            costo: c.total,
            precio: c.precio,
            margen: c.margen,
            pct: c.porcentaje,
            avisos: c.avisos,
          }))}
          etiquetaA="Materia prima"
          etiquetaB="Empaque"
        />
      </section>

      {/* ── Packs ── */}
      <section className="mb-8">
        <h2 className="text-sm tablet:text-lg font-semibold mb-2">Packs</h2>
        {packsCompletos.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-xl border border-dashed p-4">
            Todavía no se puede costear ningún pack: falta el costo de alguno
            de los productos que llevan dentro. El empaque de cada pack —caja,
            papel kraft y toallita— ya está calculado en{" "}
            <strong className="text-foreground">
              {formatCurrency(packs[0]?.empaque ?? 0)}
            </strong>
            .
          </p>
        ) : (
          <Tabla
            filas={packs.map((c) => ({
              nombre: c.nombre,
              a: c.contenido,
              b: c.empaque,
              costo: c.total,
              precio: c.precio,
              margen: c.margen,
              pct: c.porcentaje,
              avisos: c.avisos,
            }))}
            etiquetaA="Contenido"
            etiquetaB="Empaque"
          />
        )}
      </section>

      {/* ── Lo que falta ── */}
      {pendientes.length > 0 && (
        <section>
          <h2 className="text-sm tablet:text-lg font-semibold mb-2">
            Sin costo todavía{" "}
            <span className="text-muted-foreground font-normal">
              ({pendientes.length})
            </span>
          </h2>
          <ul className="space-y-2">
            {pendientes.map((c) => (
              <li
                key={c.productId}
                className="rounded-xl border bg-card p-3 flex gap-3"
              >
                <AlertTriangle className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{c.nombre}</p>
                  <ul className="mt-1 space-y-0.5">
                    {c.avisos.map((a, i) => (
                      <li key={i} className="text-2xs text-muted-foreground">
                        · {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

type Fila = {
  nombre: string;
  a: number | null;
  b: number;
  costo: number | null;
  precio: number;
  margen: number | null;
  pct: number | null;
  avisos: string[];
};

function Tabla({
  filas,
  etiquetaA,
  etiquetaB,
}: {
  filas: Fila[];
  etiquetaA: string;
  etiquetaB: string;
}) {
  return (
    <div className="rounded-xl border bg-card overflow-x-auto">
      <table className="w-full text-sm min-w-[38rem]">
        <thead>
          <tr className="border-b bg-muted/40">
            <Th className="text-left">Producto</Th>
            <Th>{etiquetaA}</Th>
            <Th>{etiquetaB}</Th>
            <Th>Costo</Th>
            <Th>Precio</Th>
            <Th>Margen</Th>
            <Th>Costo/precio</Th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.nombre} className="border-b last:border-0">
              <td className="px-3 py-2">
                <span className="font-medium">{f.nombre}</span>
                {f.avisos.length > 0 && (
                  <span
                    className="ml-1.5 text-amber-600 dark:text-amber-400"
                    title={f.avisos.join(" · ")}
                  >
                    ⚠
                  </span>
                )}
              </td>
              <Td>{f.a == null ? "—" : formatCurrency(f.a)}</Td>
              <Td>{formatCurrency(f.b)}</Td>
              <Td fuerte>{f.costo == null ? "—" : formatCurrency(f.costo)}</Td>
              <Td>{formatCurrency(f.precio)}</Td>
              <Td>{f.margen == null ? "—" : formatCurrency(f.margen)}</Td>
              <Td>
                {f.pct == null ? (
                  "—"
                ) : (
                  // Verde hasta 30 %, ámbar hasta 50, rojo por encima. Son
                  // umbrales de artesanía, no de fábrica: si más de la mitad
                  // del precio es material, no queda para el trabajo.
                  <span
                    className={
                      f.pct <= 30
                        ? "text-green-700 dark:text-green-400"
                        : f.pct <= 50
                          ? "text-amber-700 dark:text-amber-400"
                          : "text-red-700 dark:text-red-400"
                    }
                  >
                    {f.pct.toFixed(0)} %
                  </span>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  children,
  className = "text-right",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  fuerte,
}: {
  children: React.ReactNode;
  fuerte?: boolean;
}) {
  return (
    <td
      className={`px-3 py-2 text-right tabular-nums ${fuerte ? "font-semibold" : ""}`}
    >
      {children}
    </td>
  );
}
