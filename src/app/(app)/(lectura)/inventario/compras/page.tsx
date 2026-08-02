import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { ArrowLeft, ChevronRight, ShoppingCart, Check } from "lucide-react";
import { NewListButton } from "./new-list-button";

export const dynamic = "force-dynamic";

export default async function ComprasPage() {
  const lists = await prisma.shoppingList.findMany({
    orderBy: [{ doneAt: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { items: true } }, items: { select: { checked: true } } },
  });

  const abiertas = lists.filter((l) => !l.doneAt);
  const cerradas = lists.filter((l) => l.doneAt);

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

      <PageHeader
        title="Listas de compra"
        description="Arma la lista y llévala en el celular a la tienda."
        actions={<NewListButton />}
      />

      {lists.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed p-10 text-center">
          <ShoppingCart className="size-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            Todavía no hay ninguna lista.
          </p>
          <NewListButton />
        </div>
      ) : (
        <div className="space-y-5">
          {abiertas.length > 0 && (
            <section>
              <h2 className="text-sm tablet:text-lg font-semibold mb-2">Pendientes</h2>
              <ul className="space-y-2">
                {abiertas.map((l) => (
                  <li key={l.id}>
                    <ListRow
                      id={l.id}
                      name={l.name}
                      createdAt={l.createdAt}
                      total={l._count.items}
                      done={l.items.filter((i) => i.checked).length}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {cerradas.length > 0 && (
            <section>
              <h2 className="text-sm tablet:text-lg font-semibold mb-2">Completadas</h2>
              <ul className="space-y-2">
                {cerradas.map((l) => (
                  <li key={l.id}>
                    <ListRow
                      id={l.id}
                      name={l.name}
                      createdAt={l.createdAt}
                      total={l._count.items}
                      done={l.items.filter((i) => i.checked).length}
                      closed
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </>
  );
}

function ListRow({
  id,
  name,
  createdAt,
  total,
  done,
  closed,
}: {
  id: string;
  name: string;
  createdAt: Date;
  total: number;
  done: number;
  closed?: boolean;
}) {
  return (
    <Link
      href={`/inventario/compras/${id}`}
      className={`flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent transition-colors ${
        closed ? "opacity-60" : ""
      }`}
    >
      <div
        className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${
          closed
            ? "bg-muted text-muted-foreground"
            : "bg-primary/15 text-primary"
        }`}
      >
        {closed ? <Check className="size-5" /> : <ShoppingCart className="size-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold leading-tight truncate">{name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {createdAt.toLocaleDateString("es-EC", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
          {total > 0 && (
            <>
              {" · "}
              <span className="tabular-nums">
                {done}/{total}
              </span>{" "}
              {total === 1 ? "artículo" : "artículos"}
            </>
          )}
        </p>
      </div>
      <ChevronRight className="size-5 text-muted-foreground shrink-0" />
    </Link>
  );
}
