"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, RotateCcw } from "lucide-react";
import type { AvBloque } from "@/lib/audiovisual";

/**
 * Renderiza los bloques que salen de los markdown de LILUS-AUDIOVISUAL.
 *
 * Es un componente de cliente porque las listas de casillas se marcan y se
 * guardan: durante un día de rodaje de ocho horas la página se va a recargar,
 * y perder lo tachado sería peor que no tenerlo.
 */

// ──────────────────────────────────────────────────────────
// Texto en línea
// ──────────────────────────────────────────────────────────

/**
 * Negritas, código, cursivas y enlaces. Se recorre una sola vez con una
 * expresión que las cubre todas, para que no haya que anidar reemplazos ni
 * pelear con el orden en que se aplican.
 */
export function Inline({ children }: { children: string }) {
  const partes: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*)|(`[^`]+`)|(\[[^\]]+\]\([^)]+\))|(\*[^*]+\*)/g;
  let ultimo = 0;
  let m: RegExpExecArray | null;
  let k = 0;

  while ((m = re.exec(children)) !== null) {
    if (m.index > ultimo) partes.push(children.slice(ultimo, m.index));
    const t = m[0];

    if (t.startsWith("**")) {
      partes.push(
        <strong key={k++} className="font-semibold text-foreground">
          {t.slice(2, -2)}
        </strong>
      );
    } else if (t.startsWith("`")) {
      partes.push(
        <code
          key={k++}
          className="rounded bg-muted px-1 py-0.5 text-[0.9em] font-mono"
        >
          {t.slice(1, -1)}
        </code>
      );
    } else if (t.startsWith("[")) {
      const cierre = t.indexOf("](");
      const texto = t.slice(1, cierre);
      const href = t.slice(cierre + 2, -1);
      partes.push(
        href.startsWith("/") ? (
          <Link key={k++} href={href} className="text-primary underline underline-offset-2">
            {texto}
          </Link>
        ) : (
          <a
            key={k++}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 break-words"
          >
            {texto}
          </a>
        )
      );
    } else {
      partes.push(
        <em key={k++} className="italic">
          {t.slice(1, -1)}
        </em>
      );
    }
    ultimo = m.index + t.length;
  }
  if (ultimo < children.length) partes.push(children.slice(ultimo));

  return <>{partes}</>;
}

// ──────────────────────────────────────────────────────────
// Casillas
// ──────────────────────────────────────────────────────────

function Casillas({ items, id }: { items: string[]; id: string }) {
  const clave = `lilus.av.${id}`;
  const [marcadas, setMarcadas] = useState<Set<number>>(new Set());
  const [listo, setListo] = useState(false);

  useEffect(() => {
    try {
      const guardado = JSON.parse(localStorage.getItem(clave) ?? "[]");
      if (Array.isArray(guardado)) setMarcadas(new Set(guardado as number[]));
    } catch {}
    setListo(true);
  }, [clave]);

  function alternar(i: number) {
    setMarcadas((prev) => {
      const sig = new Set(prev);
      if (sig.has(i)) sig.delete(i);
      else sig.add(i);
      try {
        localStorage.setItem(clave, JSON.stringify([...sig]));
      } catch {}
      return sig;
    });
  }

  function limpiar() {
    setMarcadas(new Set());
    try {
      localStorage.removeItem(clave);
    } catch {}
  }

  const hechas = [...marcadas].filter((i) => i < items.length).length;

  return (
    <div className="rounded-xl border bg-card overflow-hidden my-3">
      {hechas > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 border-b bg-muted/40">
          <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(hechas / items.length) * 100}%` }}
            />
          </div>
          <span className="text-2xs tabular-nums text-muted-foreground shrink-0">
            {hechas}/{items.length}
          </span>
          <button
            type="button"
            onClick={limpiar}
            className="text-2xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 shrink-0"
          >
            <RotateCcw className="size-3" /> Reiniciar
          </button>
        </div>
      )}
      <ul className="divide-y">
        {items.map((it, i) => {
          const marcada = listo && marcadas.has(i);
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => alternar(i)}
                aria-pressed={marcada}
                className="w-full text-left flex items-start gap-3 p-3 hover:bg-accent transition-colors"
              >
                <span
                  className={`mt-0.5 size-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-colors ${
                    marcada
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {marcada && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                <span
                  className={`text-sm tablet:text-base leading-snug ${
                    marcada ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  <Inline>{it}</Inline>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Bloques
// ──────────────────────────────────────────────────────────

/**
 * Las citas de estos documentos son avisos, no citas de nadie. El tono se
 * deduce de cómo empiezan, que es como están escritas en el markdown.
 */
function tonoDeCita(lineas: string[]) {
  const t = lineas.join(" ");
  if (/⚠️|Ojo|OJO|nunca|Nunca|riesgo|peligro/.test(t)) return "alerta";
  if (/^>?\s*\*\*/.test(lineas[0] ?? "")) return "clave";
  return "nota";
}

const ESTILO_CITA = {
  alerta: "border-red-400 bg-red-50 dark:bg-red-950/25 dark:border-red-900",
  clave: "border-primary bg-primary/5",
  nota: "border-muted-foreground/30 bg-muted/40",
} as const;

export function AvBloques({ bloques, docId }: { bloques: AvBloque[]; docId: string }) {
  let nChecks = 0;

  return (
    <div className="max-w-none">
      {bloques.map((b, i) => {
        switch (b.kind) {
          case "h2":
            return (
              <h2
                key={i}
                className="text-lg tablet:text-2xl font-bold leading-tight mt-7 mb-2 scroll-mt-20"
                id={`s-${i}`}
              >
                <Inline>{b.text}</Inline>
              </h2>
            );

          case "h3":
            return (
              <h3
                key={i}
                className="text-sm tablet:text-lg font-semibold leading-snug mt-5 mb-1.5 text-primary"
              >
                <Inline>{b.text}</Inline>
              </h3>
            );

          case "p":
            return (
              <p key={i} className="text-sm tablet:text-base leading-relaxed mb-3">
                <Inline>{b.text}</Inline>
              </p>
            );

          case "ul":
            return (
              <ul key={i} className="space-y-1.5 mb-3 ml-1">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2.5 text-sm tablet:text-base leading-relaxed">
                    <span className="mt-2 size-1.5 rounded-full bg-primary shrink-0" />
                    <span>
                      <Inline>{it}</Inline>
                    </span>
                  </li>
                ))}
              </ul>
            );

          case "ol":
            return (
              <ol key={i} className="space-y-1.5 mb-3 ml-1">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2.5 text-sm tablet:text-base leading-relaxed">
                    <span className="text-primary font-bold tabular-nums shrink-0 w-4">
                      {j + 1}
                    </span>
                    <span>
                      <Inline>{it}</Inline>
                    </span>
                  </li>
                ))}
              </ol>
            );

          case "checks":
            return <Casillas key={i} items={b.items} id={`${docId}.${nChecks++}`} />;

          case "cita": {
            const tono = tonoDeCita(b.lineas);
            return (
              <div
                key={i}
                className={`rounded-xl border-l-4 p-3.5 my-4 ${ESTILO_CITA[tono]}`}
              >
                {b.lineas.map((ln, j) => (
                  <p
                    key={j}
                    className={`text-sm tablet:text-base leading-relaxed ${j > 0 ? "mt-2" : ""}`}
                  >
                    <Inline>{ln}</Inline>
                  </p>
                ))}
              </div>
            );
          }

          case "tabla":
            return (
              <div key={i} className="my-4 -mx-4 px-4 overflow-x-auto">
                <table className="w-full min-w-[28rem] text-sm tablet:text-base border-collapse">
                  <thead>
                    <tr className="border-b-2 border-primary/30">
                      {b.headers.map((h, j) => (
                        <th
                          key={j}
                          className="text-left font-semibold py-2 pr-3 align-bottom text-xs tablet:text-sm uppercase tracking-wide text-muted-foreground"
                        >
                          <Inline>{h}</Inline>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.filas.map((f, j) => (
                      <tr key={j} className="border-b last:border-0 align-top">
                        {f.map((celda, k) => (
                          <td key={k} className="py-2.5 pr-3 leading-snug">
                            <Inline>{celda}</Inline>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case "pre":
            return (
              <div key={i} className="my-4 -mx-4 px-4 overflow-x-auto">
                <pre className="inline-block min-w-full rounded-xl bg-muted/60 border p-3 text-[11px] tablet:text-xs leading-snug font-mono whitespace-pre">
                  {b.lineas.join("\n")}
                </pre>
              </div>
            );

          case "hr":
            return <hr key={i} className="my-6 border-t" />;

          default:
            return null;
        }
      })}
    </div>
  );
}
