import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { DictionaryBrowser, type TermCard } from "./dictionary-browser";

export const dynamic = "force-dynamic";

export default async function DiccionarioPage() {
  const terms = await prisma.glossaryTerm.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const cards: TermCard[] = terms.map((t) => ({
    id: t.id,
    slug: t.slug,
    term: t.term,
    shortDef: t.shortDef,
    category: t.category,
    aliases: t.aliases ?? "",
  }));

  return (
    <>
      <PageHeader
        title="Diccionario"
        description="Qué significa cada palabra del recetario."
      />

      <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 mb-5">
        <p className="text-sm leading-relaxed">
          Las palabras del recetario que aparecen{" "}
          <span className="underline decoration-dotted decoration-primary/60 underline-offset-2">
            subrayadas con puntitos
          </span>{" "}
          se pueden tocar: se abre una tarjeta con su explicación sin sacarte
          de la receta.
        </p>
      </div>

      {terms.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Todavía no hay palabras cargadas.
          </p>
        </div>
      ) : (
        <DictionaryBrowser terms={cards} />
      )}
    </>
  );
}
