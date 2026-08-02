"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Link2, RotateCcw, ChevronDown, Star } from "lucide-react";
import { SpeakButton, useSpeech } from "@/components/speak-button";
import { toChunks } from "@/lib/speech-chunks";
import { GlossaryText } from "@/components/glossary-text";
import { roleLabel, roleStyle } from "@/lib/roles";

type Ingredient = {
  id: string;
  name: string;
  quantity: string | null;
  note: string | null;
  optional: boolean;
  variant: string | null;
  optionGroup: string | null;
  optionLabel: string | null;
  isRecommended: boolean;
  percentage: number | null;
  /** Para qué sirve el ingrediente EN ESTA receta. */
  role: string | null;
  linked: { slug: string; name: string } | null;
};

type Step = {
  id: string;
  text: string;
  variant: string | null;
};

/**
 * Ingredientes y pasos de una receta.
 *
 * Dos agrupaciones distintas conviven aquí:
 *
 * - `variant` son fórmulas o métodos alternativos de la receta entera
 *   (las tres cremas base, los dos métodos del glicerado). Se muestran
 *   como pestañas arriba.
 *
 * - `optionGroup` son alternativas para UN ingrediente (qué conservante,
 *   qué arcilla). Se muestran como desplegable en la propia fila, y
 *   cambian la cantidad y las notas.
 *
 * La elección de cada desplegable se recuerda por receta, porque en la
 * práctica se compra un conservante y se usa ese durante meses. Lo que no
 * se guarda es el marcado de ingredientes y pasos: eso sirve para la tanda
 * que se está haciendo ahora y se limpia al recargar.
 */
export function VariantPicker({
  recipeSlug,
  variants,
  ingredients,
  steps,
}: {
  recipeSlug: string;
  variants: string[];
  ingredients: Ingredient[];
  steps: Step[];
}) {
  const [active, setActive] = useState(variants[0] ?? null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [chosen, setChosen] = useState<Record<string, string>>({});

  const storageKey = `lilus.recetario.opciones.${recipeSlug}`;

  // Elección por defecto: la marcada como recomendada, o la primera
  const defaults = useMemo(() => {
    const out: Record<string, string> = {};
    for (const ing of ingredients) {
      if (!ing.optionGroup) continue;
      if (out[ing.optionGroup]) continue;
      const group = ingredients.filter((i) => i.optionGroup === ing.optionGroup);
      out[ing.optionGroup] = (group.find((g) => g.isRecommended) ?? group[0]).id;
    }
    return out;
  }, [ingredients]);

  useEffect(() => {
    let saved: Record<string, string> = {};
    try {
      saved = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    } catch {}
    // Solo respetamos lo guardado si el id todavía existe: las recetas
    // cambian y un id viejo dejaría el grupo sin selección.
    const valid: Record<string, string> = {};
    for (const [group, id] of Object.entries(saved)) {
      if (ingredients.some((i) => i.id === id && i.optionGroup === group)) {
        valid[group] = id;
      }
    }
    setChosen({ ...defaults, ...valid });
  }, [defaults, ingredients, storageKey]);

  function choose(group: string, id: string) {
    const next = { ...chosen, [group]: id };
    setChosen(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
  }

  function toggle(id: string) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Ingredientes visibles: los de la variante activa, y de cada grupo de
  // opciones solo el elegido.
  const visibleIngredients = useMemo(() => {
    const seenGroups = new Set<string>();
    return ingredients.filter((i) => {
      if (i.variant && i.variant !== active) return false;
      if (!i.optionGroup) return true;
      if (chosen[i.optionGroup] !== i.id) return false;
      if (seenGroups.has(i.optionGroup)) return false;
      seenGroups.add(i.optionGroup);
      return true;
    });
  }, [ingredients, active, chosen]);

  const visibleSteps = useMemo(
    () => steps.filter((s) => !s.variant || s.variant === active),
    [steps, active]
  );

  const doneCount = [...visibleIngredients, ...visibleSteps].filter((x) =>
    done.has(x.id)
  ).length;
  const total = visibleIngredients.length + visibleSteps.length;

  // Lectura en voz alta. Cada ingrediente es una frase suelta, así que
  // el índice que va marcando el motor coincide con la fila.
  const ingredientSpeech = useMemo(
    () =>
      visibleIngredients.map(
        (i) =>
          `${i.name}${i.quantity ? `, ${i.quantity}` : ""}${
            i.optional ? ", opcional" : ""
          }.`
      ),
    [visibleIngredients]
  );

  // Un paso puede tener varias frases, y hay que partirlo para que Chrome
  // en Android no lo corte. Guardamos a qué paso pertenece cada frase para
  // poder resaltar el paso completo mientras se lee.
  const stepSpeech = useMemo(() => {
    const chunks: string[] = [];
    const owner: number[] = [];
    visibleSteps.forEach((s, idx) => {
      for (const c of toChunks(s.text)) {
        chunks.push(c);
        owner.push(idx);
      }
    });
    return { chunks, owner };
  }, [visibleSteps]);

  const { speakingId, chunkIndex } = useSpeech();
  const readingIngredient =
    speakingId === "ingredientes" ? chunkIndex : -1;
  const readingStep =
    speakingId === "elaboracion" ? stepSpeech.owner[chunkIndex] ?? -1 : -1;

  return (
    <div className="space-y-6">
      {/* Variantes de la receta */}
      {variants.length > 0 && (
        <div>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setActive(v)}
                className={`h-10 px-4 rounded-full text-sm font-medium border transition-colors active:scale-95 ${
                  active === v
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card hover:bg-accent"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <p className="text-2xs text-muted-foreground mt-1.5">
            {variants.length} variantes · estás viendo{" "}
            <strong className="text-foreground">{active}</strong>
          </p>
        </div>
      )}

      {/* Progreso */}
      {doneCount > 0 && (
        <div className="flex items-center gap-3">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden flex-1">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(doneCount / total) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums shrink-0">
            {doneCount}/{total}
          </span>
          <button
            type="button"
            onClick={() => setDone(new Set())}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 shrink-0"
          >
            <RotateCcw className="size-3" /> Reiniciar
          </button>
        </div>
      )}

      {/* Ingredientes */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="text-sm tablet:text-lg font-semibold">
            Ingredientes{" "}
            <span className="text-muted-foreground font-normal">
              ({visibleIngredients.length})
            </span>
          </h2>
          <SpeakButton
            id="ingredientes"
            chunks={ingredientSpeech}
            label="Escuchar"
          />
        </div>
        <ul className="rounded-xl border bg-card divide-y overflow-hidden">
          {visibleIngredients.map((ing, idx) => {
            const checked = done.has(ing.id);
            const reading = readingIngredient === idx;
            const group = ing.optionGroup
              ? ingredients.filter((i) => i.optionGroup === ing.optionGroup)
              : null;
            const role = roleLabel(ing.role);

            return (
              <li key={ing.id}>
                <div
                  className={`flex items-start gap-3 p-3 transition-colors ${
                    reading ? "bg-primary/10" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggle(ing.id)}
                    aria-label={checked ? "Desmarcar" : "Marcar"}
                    aria-pressed={checked}
                    className={`mt-0.5 size-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-colors ${
                      checked
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {checked && <Check className="size-3.5" strokeWidth={3} />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <span
                        className={`text-sm leading-snug ${
                          checked ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {ing.name}
                        {ing.optional && (
                          <span className="text-3xs uppercase tracking-wide text-muted-foreground ml-1.5">
                            opcional
                          </span>
                        )}
                      </span>
                      {ing.quantity && (
                        <span
                          className={`text-sm font-semibold tabular-nums whitespace-nowrap shrink-0 ${
                            checked ? "text-muted-foreground" : ""
                          }`}
                        >
                          {ing.quantity}
                          {ing.percentage != null && (
                            <span className="text-2xs font-normal text-muted-foreground ml-1">
                              ({ing.percentage} %)
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Para qué sirve, y alternativas si las hay */}
                    {(role || (group && group.length > 1)) && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {role && (
                          <span
                            className={`text-3xs font-medium px-2 py-0.5 rounded-full ${roleStyle(
                              ing.role
                            )} ${checked ? "opacity-50" : ""}`}
                          >
                            {role}
                          </span>
                        )}
                        {group && group.length > 1 && (
                          <OptionSelect
                            options={group}
                            value={ing.id}
                            onChange={(id) => choose(ing.optionGroup!, id)}
                          />
                        )}
                      </div>
                    )}

                    {ing.note && (
                      <p className="text-2xs text-muted-foreground mt-1 leading-snug">
                        <GlossaryText>{ing.note}</GlossaryText>
                      </p>
                    )}

                    {ing.linked && (
                      <Link
                        href={`/recetario/${ing.linked.slug}`}
                        className="inline-flex items-center gap-1 text-2xs text-primary hover:underline mt-1"
                      >
                        <Link2 className="size-3" />
                        Ver cómo se prepara
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Elaboración */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="text-sm tablet:text-lg font-semibold">Elaboración</h2>
          <SpeakButton
            id="elaboracion"
            chunks={stepSpeech.chunks}
            label="Escuchar"
          />
        </div>
        <ol className="space-y-2">
          {visibleSteps.map((step, i) => {
            const checked = done.has(step.id);
            const reading = readingStep === i;
            return (
              <li key={step.id}>
                <div
                  className={`flex gap-3 p-3 rounded-xl border transition-colors ${
                    reading
                      ? "bg-primary/10 border-primary"
                      : checked
                        ? "bg-muted/50"
                        : "bg-card"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggle(step.id)}
                    aria-label={
                      checked ? `Desmarcar paso ${i + 1}` : `Marcar paso ${i + 1}`
                    }
                    aria-pressed={checked}
                    className={`size-6 rounded-full shrink-0 flex items-center justify-center text-xs font-bold tabular-nums transition-colors ${
                      checked
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
                    }`}
                  >
                    {checked ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                  </button>
                  <p
                    className={`text-sm leading-relaxed ${
                      checked ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    <GlossaryText>{step.text}</GlossaryText>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

/** Desplegable nativo: en móvil abre la rueda del sistema, que se usa mejor. */
function OptionSelect({
  options,
  value,
  onChange,
}: {
  options: Ingredient[];
  value: string;
  onChange: (id: string) => void;
}) {
  const current = options.find((o) => o.id === value);

  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Elegir alternativa"
        className="appearance-none text-2xs font-medium rounded-full border bg-muted/60 hover:bg-accent pl-2.5 pr-7 py-1.5 cursor-pointer max-w-[15rem] truncate"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.optionLabel ?? o.name}
            {o.isRecommended ? "  ★" : ""}
          </option>
        ))}
      </select>
      <ChevronDown className="size-3 absolute right-2.5 pointer-events-none text-muted-foreground" />
      {current?.isRecommended && (
        <span className="ml-1.5 inline-flex items-center gap-0.5 text-3xs text-amber-600 dark:text-amber-400">
          <Star className="size-2.5 fill-current" />
          recomendado
        </span>
      )}
    </div>
  );
}
