"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Link2, RotateCcw, ChevronDown, Star } from "lucide-react";

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
          <p className="text-[11px] text-muted-foreground mt-1.5">
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
        <h2 className="text-sm font-semibold mb-2">
          Ingredientes{" "}
          <span className="text-muted-foreground font-normal">
            ({visibleIngredients.length})
          </span>
        </h2>
        <ul className="rounded-xl border bg-card divide-y overflow-hidden">
          {visibleIngredients.map((ing) => {
            const checked = done.has(ing.id);
            const group = ing.optionGroup
              ? ingredients.filter((i) => i.optionGroup === ing.optionGroup)
              : null;

            return (
              <li key={ing.id}>
                <div className="flex items-start gap-3 p-3">
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
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground ml-1.5">
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
                            <span className="text-[11px] font-normal text-muted-foreground ml-1">
                              ({ing.percentage} %)
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Desplegable de alternativas */}
                    {group && group.length > 1 && (
                      <OptionSelect
                        options={group}
                        value={ing.id}
                        onChange={(id) => choose(ing.optionGroup!, id)}
                      />
                    )}

                    {ing.note && (
                      <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                        {ing.note}
                      </p>
                    )}

                    {ing.linked && (
                      <Link
                        href={`/recetario/${ing.linked.slug}`}
                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-1"
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
        <h2 className="text-sm font-semibold mb-2">Elaboración</h2>
        <ol className="space-y-2">
          {visibleSteps.map((step, i) => {
            const checked = done.has(step.id);
            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => toggle(step.id)}
                  aria-pressed={checked}
                  className={`w-full text-left flex gap-3 p-3 rounded-xl border transition-colors ${
                    checked ? "bg-muted/50" : "bg-card hover:bg-accent"
                  }`}
                >
                  <span
                    className={`size-6 rounded-full shrink-0 flex items-center justify-center text-xs font-bold tabular-nums transition-colors ${
                      checked
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {checked ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                  </span>
                  <span
                    className={`text-sm leading-relaxed ${
                      checked ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {step.text}
                  </span>
                </button>
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
    <div className="relative mt-1.5 inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Elegir alternativa"
        className="appearance-none text-[11px] font-medium rounded-full border bg-muted/60 hover:bg-accent pl-2.5 pr-7 py-1.5 cursor-pointer max-w-[15rem] truncate"
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
        <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400">
          <Star className="size-2.5 fill-current" />
          recomendado
        </span>
      )}
    </div>
  );
}
