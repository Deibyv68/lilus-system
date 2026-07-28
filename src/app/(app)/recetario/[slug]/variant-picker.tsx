"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Link2, RotateCcw } from "lucide-react";

type Ingredient = {
  id: string;
  name: string;
  quantity: string | null;
  note: string | null;
  optional: boolean;
  variant: string | null;
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
 * Si la receta tiene variantes (dos fórmulas de crema base, dos métodos
 * del glicerado) se muestran como pestañas y solo se ve la seleccionada.
 * Lo que no tiene variante se muestra siempre, porque es común a todas.
 *
 * Los ingredientes y pasos se pueden ir marcando mientras se elabora. Es
 * estado local a propósito: sirve para la sesión de trabajo actual y se
 * limpia al recargar.
 */
export function VariantPicker({
  variants,
  ingredients,
  steps,
}: {
  variants: string[];
  ingredients: Ingredient[];
  steps: Step[];
}) {
  const [active, setActive] = useState(variants[0] ?? null);
  const [done, setDone] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const visibleIngredients = useMemo(
    () => ingredients.filter((i) => !i.variant || i.variant === active),
    [ingredients, active]
  );
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
      {/* Selector de variante */}
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
            Esta receta tiene {variants.length} variantes. Estás viendo:{" "}
            <strong className="text-foreground">{active}</strong>
          </p>
        </div>
      )}

      {/* Progreso, solo cuando ya se marcó algo */}
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
                        </span>
                      )}
                    </div>

                    {ing.note && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                        {ing.note}
                      </p>
                    )}

                    {/* Enlace a la receta que prepara este ingrediente */}
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
