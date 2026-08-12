import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, List } from "lucide-react";
import {
  docPorSlug,
  todosLosDocs,
  seccionMeta,
  vecinos,
} from "@/lib/audiovisual";
import { AvBloques } from "@/components/av-blocks";

export const dynamic = "force-dynamic";

export default async function AvDocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = docPorSlug(slug);
  if (!doc) notFound();

  const meta = seccionMeta(doc.seccion);
  const Icon = meta.icon;
  const { anterior, siguiente } = vecinos(slug);

  // Índice de la página: solo los títulos de nivel 2. En los documentos
  // largos —los de plano a plano pasan de cuarenta bloques— es la
  // diferencia entre poder saltar a un bloque y tener que scrollear.
  const indice = doc.bloques
    .map((b, i) => (b.kind === "h2" ? { i, text: b.text } : null))
    .filter((x): x is { i: number; text: string } => x !== null);

  return (
    <>
      <div className="mb-4">
        <Link
          href="/audiovisual"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Audiovisual
        </Link>
      </div>

      {/* ─── Encabezado ─── */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${meta.chip}`}
        >
          <Icon className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <span
            className={`inline-block text-3xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${meta.chip}`}
          >
            {meta.label}
          </span>
          <h1 className="text-xl tablet:text-2xl font-bold leading-tight mt-1.5">
            {doc.titulo}
          </h1>
        </div>
      </div>

      {doc.resumen && (
        <p className="text-sm tablet:text-base text-muted-foreground leading-snug mb-3">
          {doc.resumen}
        </p>
      )}

      <p className="text-2xs text-muted-foreground inline-flex items-center gap-1 mb-5">
        <Clock className="size-3" />
        {doc.minutos} min de lectura · {doc.palabras} palabras
      </p>

      {/* ─── Índice de la página ─── */}
      {indice.length > 2 && (
        <details className="rounded-xl border bg-card mb-5 group">
          <summary className="flex items-center gap-2 p-3 cursor-pointer list-none font-semibold text-sm tablet:text-base">
            <List className="size-4 text-muted-foreground" />
            En esta página
            <span className="text-2xs font-normal text-muted-foreground ml-auto">
              {indice.length} secciones
            </span>
          </summary>
          <ul className="border-t divide-y">
            {indice.map(({ i, text }) => (
              <li key={i}>
                <a
                  href={`#s-${i}`}
                  className="block px-3 py-2.5 text-sm tablet:text-base hover:bg-accent transition-colors"
                >
                  {text.replace(/\*\*/g, "")}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* ─── El documento ─── */}
      <AvBloques bloques={doc.bloques} docId={doc.slug} />

      {/* ─── Anterior y siguiente ─── */}
      {(anterior || siguiente) && (
        <nav className="mt-8 pt-5 border-t grid gap-2 sm:grid-cols-2">
          {anterior ? (
            <Link
              href={`/audiovisual/${anterior.slug}`}
              className="flex items-center gap-2 p-3 rounded-xl border bg-card hover:bg-accent transition-colors"
            >
              <ArrowLeft className="size-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-2xs text-muted-foreground">Anterior</p>
                <p className="text-sm font-medium leading-tight truncate">
                  {anterior.titulo}
                </p>
              </div>
            </Link>
          ) : (
            <span />
          )}
          {siguiente && (
            <Link
              href={`/audiovisual/${siguiente.slug}`}
              className="flex items-center gap-2 p-3 rounded-xl border bg-card hover:bg-accent transition-colors sm:text-right"
            >
              <div className="min-w-0 flex-1">
                <p className="text-2xs text-muted-foreground">Siguiente</p>
                <p className="text-sm font-medium leading-tight truncate">
                  {siguiente.titulo}
                </p>
              </div>
              <ArrowRight className="size-4 text-muted-foreground shrink-0" />
            </Link>
          )}
        </nav>
      )}
    </>
  );
}

export async function generateStaticParams() {
  return todosLosDocs().map((d) => ({ slug: d.slug }));
}
