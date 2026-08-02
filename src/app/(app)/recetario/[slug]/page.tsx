import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { categoryMeta } from "@/lib/recetario";
import {
  ArrowLeft,
  Package,
  Clock,
  Scale,
  Box,
  Link2,
  Info,
  CornerDownRight,
  Hand,
} from "lucide-react";
import { VariantPicker } from "./variant-picker";
import {
  SpeechProvider,
  SpeakButton,
  SpeechUnsupportedNote,
} from "@/components/speak-button";
import { toChunks } from "@/lib/speech-chunks";
import { GlossaryProvider, GlossaryText } from "@/components/glossary-text";

export const dynamic = "force-dynamic";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const recipe = await prisma.recipe.findUnique({
    where: { slug },
    include: {
      product: { select: { id: true, name: true, sku: true } },
      ingredients: {
        orderBy: { sortOrder: "asc" },
        include: {
          linkedRecipe: { select: { slug: true, name: true, category: true } },
        },
      },
      steps: { orderBy: { sortOrder: "asc" } },
      benefits: { orderBy: { sortOrder: "asc" } },
      usedIn: {
        include: {
          recipe: { select: { slug: true, name: true, category: true } },
        },
      },
    },
  });

  if (!recipe || !recipe.isActive) notFound();

  const glossary = await prisma.glossaryTerm.findMany({
    where: { isActive: true },
    select: { slug: true, term: true, aliases: true, shortDef: true },
  });
  const glossaryTerms = glossary.map((g) => ({
    slug: g.slug,
    term: g.term,
    aliases: g.aliases ? g.aliases.split(",").map((a) => a.trim()) : [],
    shortDef: g.shortDef,
  }));

  const meta = categoryMeta(recipe.category);
  const Icon = meta.icon;

  // Las variantes agrupan fórmulas o métodos alternativos de la misma
  // receta (las dos cremas base, los dos métodos del glicerado).
  const variants = Array.from(
    new Set(
      [
        ...recipe.ingredients.map((i) => i.variant),
        ...recipe.steps.map((s) => s.variant),
      ].filter((v): v is string => !!v)
    )
  );

  const notes = recipe.notes?.split("\n").filter(Boolean) ?? [];

  // Beneficios: los que nombran un ingrediente van en tabla, el resto en lista
  const generalBenefits = recipe.benefits.filter((b) => !b.ingredient);
  const perIngredient = recipe.benefits.filter((b) => b.ingredient);

  // Dedup del índice inverso: una receta puede usar esta más de una vez
  const usedInRecipes = Array.from(
    new Map(recipe.usedIn.map((u) => [u.recipe.slug, u.recipe])).values()
  );

  // ── Textos para la lectura en voz alta ──
  // Se arman aquí, en el servidor, para que el cliente solo reciba las
  // frases ya listas para encolar.
  const speakBenefits = [
    "Beneficios.",
    ...generalBenefits.map((b) => b.text),
    ...perIngredient.map((b) => `${b.ingredient}. ${b.text}`),
  ].flatMap(toChunks);

  const speakNotes = ["Notas.", ...notes].flatMap(toChunks);

  const speakUsage = recipe.usage
    ? ["Modo de uso.", recipe.usage].flatMap(toChunks)
    : [];

  // La lectura completa arranca por ingredientes y pasos, que es lo que
  // se necesita con las manos ocupadas. Los ingredientes y pasos de la
  // receta base van sin variante; si hay variantes, se lee la primera.
  const firstVariant = variants[0] ?? null;
  const speakAll = [
    recipe.name,
    ...(recipe.summary ? [recipe.summary] : []),
    "Ingredientes.",
    // De cada grupo de alternativas se lee solo la recomendada: leer las
    // tres opciones de conservante seguidas confundiría más que ayudar.
    ...recipe.ingredients
      .filter((i) => {
        if (i.variant && i.variant !== firstVariant) return false;
        if (!i.optionGroup) return true;
        const group = recipe.ingredients.filter(
          (g) => g.optionGroup === i.optionGroup
        );
        return (group.find((g) => g.isRecommended) ?? group[0]).id === i.id;
      })
      .map((i) => `${i.name}${i.quantity ? `, ${i.quantity}` : ""}.`),
    "Elaboración.",
    ...recipe.steps
      .filter((s) => !s.variant || s.variant === firstVariant)
      .map((s, i) => `Paso ${i + 1}. ${s.text}`),
    ...speakBenefits,
    ...speakUsage,
    ...speakNotes,
  ].flatMap(toChunks);

  return (
    <SpeechProvider>
      <GlossaryProvider terms={glossaryTerms}>
      <div className="mb-4">
        <Link
          href="/recetario"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Recetario
        </Link>
      </div>

      {/* ─── Encabezado ─── */}
      <div className="flex items-start gap-4 mb-5">
        {recipe.imageUrl ? (
          <div className="relative size-20 rounded-xl overflow-hidden bg-muted shrink-0">
            <Image
              src={recipe.imageUrl}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
        ) : (
          <div
            className={`size-20 rounded-xl flex items-center justify-center shrink-0 ${meta.chip}`}
          >
            <Icon className="size-9" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <span
            className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${meta.chip}`}
          >
            {meta.short}
          </span>
          <h1 className="text-xl font-bold leading-tight mt-1.5">
            {recipe.name}
          </h1>
          {recipe.summary && (
            <p className="text-sm text-muted-foreground mt-1 leading-snug">
              {recipe.summary}
            </p>
          )}
        </div>
      </div>

      {/* ─── Escuchar toda la receta ─── */}
      <div className="mb-5">
        <SpeakButton
          id="todo"
          chunks={speakAll}
          label="Escuchar toda la receta"
          size="lg"
        />
        <SpeechUnsupportedNote />
      </div>

      {/* ─── Ficha técnica ─── */}
      {(recipe.yield || recipe.restTime || recipe.container || recipe.product) && (
        <div className="grid grid-cols-2 gap-2 mb-5">
          {recipe.yield && (
            <SpecCard icon={Scale} label="Rinde" value={recipe.yield} />
          )}
          {recipe.restTime && (
            <SpecCard icon={Clock} label="Reposo" value={recipe.restTime} />
          )}
          {recipe.container && (
            <SpecCard icon={Box} label="Envase" value={recipe.container} />
          )}
          {recipe.product && (
            <Link href={`/productos/${recipe.product.id}`} className="contents">
              <SpecCard
                icon={Package}
                label="Producto"
                value={recipe.product.name}
                interactive
              />
            </Link>
          )}
        </div>
      )}

      {/* ─── pH ─── */}
      {recipe.phValue && (
        <div
          className={`rounded-xl border p-3 mb-5 flex items-start gap-3 ${
            recipe.phKind === "objetivo"
              ? "border-sky-300 bg-sky-50 dark:bg-sky-950/25 dark:border-sky-900"
              : "bg-card"
          }`}
        >
          <div
            className={`size-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
              recipe.phKind === "objetivo"
                ? "bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300"
                : "bg-muted text-muted-foreground"
            }`}
          >
            pH
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">
              {recipe.phValue}
              <span className="font-normal text-muted-foreground ml-1.5">
                {recipe.phKind === "objetivo" ? "· ajustar" : "· solo verificar"}
              </span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
              {recipe.phKind === "objetivo"
                ? "Medir al final y corregir con ácido láctico hasta entrar en rango. En cremas, diluir 1 parte en 9 de agua destilada: la tira no lee bien sobre crema pura."
                : "Lo da la base que se compra y no se puede cambiar de forma útil. Solo comprobar que esté en rango."}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* ─── Ingredientes y pasos ─── */}
        <VariantPicker
          recipeSlug={recipe.slug}
          variants={variants}
          ingredients={recipe.ingredients.map((i) => ({
            id: i.id,
            name: i.name,
            quantity: i.quantity,
            note: i.note,
            optional: i.optional,
            variant: i.variant,
            optionGroup: i.optionGroup,
            optionLabel: i.optionLabel,
            isRecommended: i.isRecommended,
            percentage: i.percentage,
            role: i.role,
            linked: i.linkedRecipe
              ? { slug: i.linkedRecipe.slug, name: i.linkedRecipe.name }
              : null,
          }))}
          steps={recipe.steps.map((s) => ({
            id: s.id,
            text: s.text,
            variant: s.variant,
          }))}
        />

        {/* ─── Beneficios ─── */}
        {(generalBenefits.length > 0 || perIngredient.length > 0) && (
          <section>
            <SectionTitle
              action={
                <SpeakButton id="beneficios" chunks={speakBenefits} label="Escuchar" />
              }
            >
              Beneficios
            </SectionTitle>
            <div className="rounded-xl border bg-card overflow-hidden">
              {generalBenefits.length > 0 && (
                <ul className="p-4 space-y-1.5">
                  {generalBenefits.map((b) => (
                    <li key={b.id} className="flex gap-2 text-sm">
                      <span className={`shrink-0 ${meta.accent}`}>•</span>
                      <span>
                        <GlossaryText>{b.text}</GlossaryText>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {perIngredient.length > 0 && (
                <div
                  className={
                    generalBenefits.length > 0 ? "border-t divide-y" : "divide-y"
                  }
                >
                  {perIngredient.map((b) => (
                    <div key={b.id} className="px-4 py-2.5">
                      <p className="text-xs font-semibold">{b.ingredient}</p>
                      <p className="text-sm text-muted-foreground leading-snug mt-0.5">
                        <GlossaryText>{b.text}</GlossaryText>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ─── Modo de uso ─── */}
        {recipe.usage && (
          <section>
            <SectionTitle
              action={
                <SpeakButton id="uso" chunks={speakUsage} label="Escuchar" />
              }
            >
              Modo de uso
            </SectionTitle>
            <div className="rounded-xl border bg-card p-4 flex gap-3">
              <Hand className={`size-4 mt-0.5 shrink-0 ${meta.accent}`} />
              <p className="text-sm leading-relaxed">
                <GlossaryText>{recipe.usage}</GlossaryText>
              </p>
            </div>
          </section>
        )}

        {/* ─── Notas ─── */}
        {notes.length > 0 && (
          <section>
            <SectionTitle
              action={
                <SpeakButton id="notas" chunks={speakNotes} label="Escuchar" />
              }
            >
              Notas
            </SectionTitle>
            <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/25 dark:border-amber-900 p-4">
              <ul className="space-y-2">
                {notes.map((n, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-relaxed">
                    <Info className="size-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>
                      <GlossaryText>{n}</GlossaryText>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ─── Dónde se usa esta preparación (índice inverso) ─── */}
        {usedInRecipes.length > 0 && (
          <section>
            <SectionTitle>Se usa en</SectionTitle>
            <ul className="space-y-2">
              {usedInRecipes.map((u) => {
                const m = categoryMeta(u.category);
                const UIcon = m.icon;
                return (
                  <li key={u.slug}>
                    <Link
                      href={`/recetario/${u.slug}`}
                      className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent transition-colors"
                    >
                      <div
                        className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${m.chip}`}
                      >
                        <UIcon className="size-4" />
                      </div>
                      <span className="text-sm font-medium flex-1 min-w-0 truncate">
                        {u.name}
                      </span>
                      <CornerDownRight className="size-4 text-muted-foreground shrink-0" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
      </GlossaryProvider>
    </SpeechProvider>
  );
}

// ─────────────────────────────────────────────────────────────

function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-2">
      <h2 className="text-sm font-semibold">{children}</h2>
      {action}
    </div>
  );
}

function SpecCard({
  icon: Icon,
  label,
  value,
  interactive,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-card p-3 ${
        interactive ? "hover:bg-accent transition-colors" : ""
      }`}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        <Icon className="size-3.5" />
        <span className="text-[10px] uppercase tracking-wider font-medium">
          {label}
        </span>
        {interactive && <Link2 className="size-3 ml-auto" />}
      </div>
      <p className="text-sm font-semibold leading-tight">{value}</p>
    </div>
  );
}
