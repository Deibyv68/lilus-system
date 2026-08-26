import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { glossaryCategoryMeta } from "@/lib/diccionario";
import { ArrowLeft, Lightbulb, ChevronRight } from "lucide-react";
import { SpeechProvider, SpeakButton } from "@/components/speak-button";
import { toChunks } from "@/lib/speech-chunks";

export const dynamic = "force-dynamic";

export default async function TerminoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const term = await prisma.glossaryTerm.findUnique({ where: { slug } });
  if (!term || !term.isActive) notFound();

  // Otros términos de la misma categoría, para seguir leyendo
  const related = await prisma.glossaryTerm.findMany({
    where: { category: term.category, isActive: true, id: { not: term.id } },
    orderBy: { sortOrder: "asc" },
    take: 4,
    select: { slug: true, term: true, shortDef: true },
  });

  const meta = glossaryCategoryMeta(term.category);
  const Icon = meta.icon;

  const paragraphs = term.longDef?.split("\n").filter(Boolean) ?? [];

  const readAloud = [
    term.term,
    term.shortDef,
    ...paragraphs,
    ...(term.example ? ["Por ejemplo.", term.example] : []),
  ].flatMap(toChunks);

  return (
    <SpeechProvider>
      <div className="mb-4">
        <Link
          href="/sistema/diccionario"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Diccionario
        </Link>
      </div>

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
            {meta.short}
          </span>
          <h1 className="text-2xl font-bold leading-tight mt-1.5">
            {term.term}
          </h1>
        </div>
      </div>

      <div className="mb-4">
        <SpeakButton
          id="termino"
          chunks={readAloud}
          label="Escuchar"
          size="lg"
        />
      </div>

      {/* Definición corta, destacada */}
      <div className="rounded-xl border-l-4 border-primary bg-primary/5 p-4 mb-5">
        <p className="leading-relaxed">{term.shortDef}</p>
      </div>

      {/* Explicación completa */}
      {paragraphs.length > 0 && (
        <div className="space-y-3 mb-5">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed">
              {p}
            </p>
          ))}
        </div>
      )}

      {/* Ejemplo del propio recetario */}
      {term.example && (
        <section className="mb-6">
          <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/25 dark:border-amber-900 p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Lightbulb className="size-4 text-amber-600 dark:text-amber-400" />
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                En nuestras recetas
              </p>
            </div>
            <p className="text-sm leading-relaxed">{term.example}</p>
          </div>
        </section>
      )}

      {/* Seguir leyendo */}
      {related.length > 0 && (
        <section>
          <h2 className="text-sm tablet:text-lg font-semibold mb-2">Palabras relacionadas</h2>
          <ul className="space-y-2">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/sistema/diccionario/${r.slug}`}
                  className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium leading-tight">{r.term}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {r.shortDef}
                    </p>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </SpeechProvider>
  );
}
